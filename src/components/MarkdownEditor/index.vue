<template>
  <section
    ref="editorShellRef"
    :class="['h_markdown_editor', { h_markdown_editor_readonly: readonly }]"
    @focusin="enterEditMode"
    @pointerdown.capture="handleEditorPointerDown"
  >
    <MdEditor
      v-if="editorMode === 'edit'"
      ref="mdEditorRef"
      v-model="editorValue"
      class="h_markdown_editor_body"
      language="zh-CN"
      placeholder="记录内容..."
      theme="dark"
      preview-theme="github"
      code-theme="atom"
      :preview="false"
      :html-preview="false"
      :readOnly="readonly"
      :toolbars="editorToolbars"
      :footers="[]"
      :no-upload-img="true"
      @onFocus="handleFocus"
      @onBlur="handleBlur"
    />

    <MarkdownPreview
      v-else
      :model-value="previewMarkdown"
      @activate="enterEditMode"
    />
  </section>
</template>

<script setup lang="ts">
import { MdEditor, type ExposeParam, type ToolbarNames } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from "vue";
import MarkdownPreview from "@/components/MarkdownPreview/index.vue";

type MarkdownEditorMode = "edit" | "preview";

const EMPTY_MARKDOWN = "";

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

const editorShellRef = ref<HTMLElement>();
const mdEditorRef = ref<ExposeParam>();
const editorValue = ref(props.modelValue || EMPTY_MARKDOWN);
let focusDraftSnapshot = editorValue.value;
let isInternalPointerDown = false;

const readonly = computed(() => props.readonly);
const editorMode = computed<MarkdownEditorMode>({
  get: () => props.mode,
  set: (value) => emit("update:mode", value),
});
const previewMarkdown = computed(() => editorValue.value || EMPTY_MARKDOWN);

const editorToolbars: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "codeRow",
  "code",
  "table",
  "revoke",
  "next",
];

const normalizeEditorValue = (value: string) => value.trim();

const syncFocusDraftSnapshot = () => {
  focusDraftSnapshot = editorValue.value;
};

const hasFocusDraftChanged = () =>
  normalizeEditorValue(editorValue.value) !== normalizeEditorValue(focusDraftSnapshot);

const shouldExitEditMode = () => !hasFocusDraftChanged() || !props.dirty;

const exitEditMode = () => {
  if (shouldExitEditMode()) {
    editorMode.value = "preview";
  }
};

const focusEditor = async () => {
  await nextTick();
  mdEditorRef.value?.focus();
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

const handleEditorPointerDown = () => {
  isInternalPointerDown = true;
};

const handleWindowPointerDown = (event: PointerEvent) => {
  const targetNode = event.target instanceof Node ? event.target : null;

  if (!targetNode || editorShellRef.value?.contains(targetNode)) return;
  if (editorMode.value !== "edit") return;

  isInternalPointerDown = false;
  exitEditMode();
};

const handleWindowPointerUp = () => {
  isInternalPointerDown = false;
};

const handleFocus = () => {
  if (!readonly.value) {
    editorMode.value = "edit";
  }
};

const handleBlur = async () => {
  await nextTick();

  if (isInternalPointerDown) return;

  const activeNode = document.activeElement;

  if (activeNode && editorShellRef.value?.contains(activeNode)) return;

  exitEditMode();
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
  editorValue,
  (value) => {
    if (value === props.modelValue) return;

    emit("update:modelValue", value);
  },
);

watch(
  () => props.modelValue,
  (value) => {
    const nextValue = value || EMPTY_MARKDOWN;

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

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("pointerdown", handleWindowPointerDown);
  window.addEventListener("pointerup", handleWindowPointerUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("pointerdown", handleWindowPointerDown);
  window.removeEventListener("pointerup", handleWindowPointerUp);
});
</script>

<style lang="scss" scoped src="./index.scss"></style>
