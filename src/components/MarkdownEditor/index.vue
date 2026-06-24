<template>
  <section
    ref="editorShellRef"
    :class="['h_markdown_editor', { h_markdown_editor_readonly: readonly }]"
    @focusin="enterEditMode"
  >
    <MdEditor
      ref="mdEditorRef"
      v-show="editorMode === 'edit'"
      v-model="editorValue"
      class="h_markdown_editor_body"
      language="zh-CN"
      placeholder="记录内容..."
      theme="dark"
      preview-theme="github"
      code-theme="atom"
      :preview="false"
      :html-preview="false"
      :read-only="readonly"
      :toolbars="editorToolbars"
      :footers="[]"
      :no-upload-img="true"
      @on-focus="handleFocus"
      @on-blur="handleBlur"
    />

    <MarkdownPreview
      v-show="editorMode === 'preview'"
      :model-value="previewMarkdown"
      @activate="enterEditMode"
    />
  </section>
</template>

<script setup lang="ts">
import { MdEditor, type ExposeParam } from "md-editor-v3";
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

const readonly = computed(() => props.readonly);
const editorMode = computed<MarkdownEditorMode>({
  get: () => props.mode,
  set: (value) => emit("update:mode", value),
});
const previewMarkdown = computed(() => editorValue.value || EMPTY_MARKDOWN);

const editorToolbars = [
  "bold",
  "underline",
  "italic",
  "strike-through",
  "title",
  "sub",
  "sup",
  "quote",
  "unordered-list",
  "ordered-list",
  "code-row",
  "code",
  "table",
  "revoke",
  "next",
] as const;

const normalizeEditorValue = (value: string) => value.trim();

const syncFocusDraftSnapshot = () => {
  focusDraftSnapshot = editorValue.value;
};

const hasFocusDraftChanged = () =>
  normalizeEditorValue(editorValue.value) !== normalizeEditorValue(focusDraftSnapshot);

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

const handleFocus = () => {
  if (!readonly.value) {
    editorMode.value = "edit";
  }
};

const handleBlur = async () => {
  await nextTick();

  const activeNode = document.activeElement;

  if (activeNode && editorShellRef.value?.contains(activeNode)) return;

  if (!hasFocusDraftChanged() || !props.dirty) {
    editorMode.value = "preview";
  }
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
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style lang="scss" scoped src="./index.scss"></style>
