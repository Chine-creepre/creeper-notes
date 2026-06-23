<template>
  <section class="h_markdown_editor" @focusin="enterEditMode">
    <Toolbar
      class="h_markdown_editor_toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />

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

    <article
      v-show="editorMode === 'preview'"
      class="h_markdown_editor_preview"
      tabindex="0"
      @focus="enterEditMode"
      @click="enterEditMode"
      v-html="previewHtml"
    ></article>
  </section>
</template>

<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import "./index.scss";

type MarkdownEditorMode = "edit" | "preview";

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

const editorRef = shallowRef<IDomEditor>();
const editorValue = ref(props.modelValue || "");

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

const previewHtml = computed(() => editorValue.value || "<p><br></p>");

const syncReadonlyState = () => {
  const editor = editorRef.value;

  if (!editor) return;

  if (props.readonly) {
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
  if (mode === "edit" && props.readonly) return;

  editorMode.value = mode;

  if (mode === "edit") {
    await focusEditor();
  }
};

const enterEditMode = async () => {
  if (props.readonly) return;
  if (editorMode.value === "edit") return;

  await setEditorMode("edit");
};

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
  syncReadonlyState();
};

const handleFocus = () => {
  if (!props.readonly) {
    editorMode.value = "edit";
  }
};

const handleBlur = () => {
  if (!props.dirty) {
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
  },
);

watch(
  () => props.mode,
  async (mode) => {
    if (mode === "edit" && !props.readonly) {
      await focusEditor();
    }
  },
);

watch(
  () => props.readonly,
  syncReadonlyState,
);

window.addEventListener("keydown", handleKeydown);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  editorRef.value?.destroy();
});
</script>
