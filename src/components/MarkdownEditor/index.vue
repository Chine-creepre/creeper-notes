<template>
  <section :class="['h_markdown_editor', { h_markdown_editor_readonly: readonly }]" @focusin="enterEditMode">
    <div ref="toolbarRef" class="h_markdown_editor_toolbar_wrap">
      <Toolbar
        class="h_markdown_editor_toolbar"
        :editor="editorRef"
        :default-config="toolbarConfig"
        mode="default"
      />
    </div>

    <Editor
      v-show="editorMode === 'edit'"
      v-model="editorValue"
      class="h_markdown_editor_body"
      :default-config="editorConfig"
      mode="default"
      @on-blur="handleBlur"
      @on-created="handleCreated"
      @on-focus="handleFocus"
      @on-change="handleChange"
    />

    <MarkdownPreview
      v-show="editorMode === 'preview'"
      :model-value="previewHtml"
      @activate="enterEditMode"
    />
  </section>
</template>

<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import MarkdownPreview from "@/components/MarkdownPreview/index.vue";

type MarkdownEditorMode = "edit" | "preview";

const EMPTY_EDITOR_HTML = "<p><br></p>";
const TOOLBAR_TIP_SELECTOR = [
  ".w-e-bar-item .title",
  ".w-e-bar-item-tooltip",
  ".w-e-bar-tooltip",
  ".w-e-tooltip",
  ".w-e-menu-tooltip",
  ".w-e-hover-bar",
].join(",");

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    dirty?: boolean;
    mode?: MarkdownEditorMode;
  }>(),
  {
    readonly: false,
    dirty: false,
    mode: "preview",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:mode": [value: MarkdownEditorMode];
  save: [];
}>();

const toolbarRef = ref<HTMLElement>();
const editorRef = shallowRef<IDomEditor>();
const editorValue = ref(props.modelValue || "");
let focusDraftSnapshot = editorValue.value;
let toolbarTipObserver: MutationObserver | undefined;
let documentTipObserver: MutationObserver | undefined;
let toolbarCleanupTimer: number | undefined;

const readonly = computed(() => props.readonly);
const editorMode = computed<MarkdownEditorMode>({
  get: () => props.mode,
  set: (value) => emit("update:mode", value),
});

const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    "headerSelect",
    "bold",
    "italic",
    "through",
    "bulletedList",
    "numberedList",
    "todo",
    "blockquote",
    "codeBlock",
    "divider",
    "undo",
    "redo",
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: "记录内容...",
  autoFocus: false,
  scroll: true,
};

const previewHtml = computed(() => editorValue.value || EMPTY_EDITOR_HTML);

const normalizeEditorValue = (value: string) => value.trim() || EMPTY_EDITOR_HTML;

const syncFocusDraftSnapshot = () => {
  focusDraftSnapshot = editorValue.value;
};

const hasFocusDraftChanged = () =>
  normalizeEditorValue(editorValue.value) !== normalizeEditorValue(focusDraftSnapshot);

const clearToolbarTips = () => {
  const toolbar = toolbarRef.value;

  toolbar?.querySelectorAll("[title]").forEach((item) => {
    item.removeAttribute("title");
  });

  toolbar?.querySelectorAll("[data-title]").forEach((item) => {
    item.removeAttribute("data-title");
  });

  toolbar?.querySelectorAll("[data-tooltip]").forEach((item) => {
    item.removeAttribute("data-tooltip");
  });

  toolbar?.querySelectorAll(TOOLBAR_TIP_SELECTOR).forEach((item) => {
    item.remove();
  });

  document.body.querySelectorAll(TOOLBAR_TIP_SELECTOR).forEach((item) => {
    item.remove();
  });
};

const scheduleClearToolbarTips = () => {
  if (toolbarCleanupTimer) {
    window.clearTimeout(toolbarCleanupTimer);
  }

  toolbarCleanupTimer = window.setTimeout(clearToolbarTips, 0);
};

const observeToolbarTips = async () => {
  await nextTick();
  clearToolbarTips();

  const toolbar = toolbarRef.value;

  toolbarTipObserver?.disconnect();
  documentTipObserver?.disconnect();

  if (toolbar) {
    toolbarTipObserver = new MutationObserver(scheduleClearToolbarTips);
    toolbarTipObserver.observe(toolbar, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["title", "data-title", "data-tooltip", "class", "style"],
    });
  }

  documentTipObserver = new MutationObserver(scheduleClearToolbarTips);
  documentTipObserver.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
};

const syncReadonlyState = () => {
  const editor = editorRef.value;

  if (!editor) return;

  if (readonly.value) {
    editor.disable();
    return;
  }

  editor.enable();
};

const focusEditor = async () => {
  await nextTick();
  editorRef.value?.focus(true);
};

const setEditorMode = async (mode: MarkdownEditorMode) => {
  if (mode === "edit" && readonly.value) return;

  if (mode === "edit" && editorMode.value !== "edit") {
    syncFocusDraftSnapshot();
  }

  editorMode.value = mode;

  if (mode === "edit") {
    await focusEditor();
  }
};

const enterEditMode = async () => {
  if (readonly.value) return;
  if (editorMode.value === "edit") return;

  await setEditorMode("edit");
};

const handleCreated = async (editor: IDomEditor) => {
  editorRef.value = editor;
  syncReadonlyState();
  await observeToolbarTips();
};

const handleFocus = () => {
  if (!readonly.value) {
    editorMode.value = "edit";
  }
};

const handleBlur = () => {
  if (!hasFocusDraftChanged() || !props.dirty) {
    editorMode.value = "preview";
  }
};

const handleChange = (editor: IDomEditor) => {
  const html = editor.getHtml();

  if (html === props.modelValue) return;

  editorValue.value = html;
  emit("update:modelValue", html);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (readonly.value) return;
  if (!(event.ctrlKey || event.metaKey)) return;
  if (event.key.toLowerCase() !== "s") return;

  event.preventDefault();
  event.stopPropagation();
  emit("save");
};

watch(
  () => props.modelValue,
  (value) => {
    const nextValue = value || "";

    if (nextValue === editorValue.value) return;

    editorValue.value = nextValue;

    if (editorMode.value !== "edit") {
      syncFocusDraftSnapshot();
    }
  },
);

watch(
  () => props.mode,
  async (mode) => {
    if (mode === "edit" && !readonly.value) {
      syncFocusDraftSnapshot();
      await focusEditor();
    }
  },
);

watch(
  () => props.readonly,
  syncReadonlyState,
);

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  syncReadonlyState();
  await observeToolbarTips();
});

onBeforeUnmount(() => {
  if (toolbarCleanupTimer) {
    window.clearTimeout(toolbarCleanupTimer);
  }

  toolbarTipObserver?.disconnect();
  documentTipObserver?.disconnect();
  window.removeEventListener("keydown", handleKeydown);
  editorRef.value?.destroy();
});
</script>

<style lang="scss" scoped src="./index.scss"></style>
