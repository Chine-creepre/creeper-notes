<template>
  <section
    :class="[
      'h_markdown_editor',
      {
        h_markdown_editor_edit_mode: editorMode === 'edit',
        h_markdown_editor_preview_mode: editorMode === 'preview',
        h_markdown_editor_readonly: readonly,
      },
    ]"
  >
    <header class="h_markdown_editor_header">
      <div class="h_markdown_editor_tabs">
        <button
          :class="['h_markdown_editor_tab', { h_markdown_editor_tab_active: editorMode === 'edit' }]"
          :disabled="readonly"
          type="button"
          @click="setEditorMode('edit')"
        >
          编辑
        </button>
        <button
          :class="['h_markdown_editor_tab', { h_markdown_editor_tab_active: editorMode === 'preview' }]"
          type="button"
          @click="setEditorMode('preview')"
        >
          预览
        </button>
      </div>

      <div class="h_markdown_editor_state">
        <span v-if="readonly">只读</span>
        <span v-else-if="dirty">未保存</span>
        <span v-else>已同步</span>
      </div>
    </header>

    <Toolbar
      v-show="editorMode === 'edit' && !readonly"
      class="h_markdown_editor_toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />

    <div class="h_markdown_editor_content">
      <Editor
        v-show="editorMode === 'edit'"
        v-model="editorValue"
        class="h_markdown_editor_body"
        :default-config="editorConfig"
        mode="default"
        @on-created="handleCreated"
        @on-focus="handleFocus"
        @on-change="handleChange"
      />

      <article v-show="editorMode === 'preview'" class="h_markdown_editor_preview" tabindex="0">
        <div v-if="isPreviewEmpty" class="h_markdown_editor_empty">
          <strong>暂无内容</strong>
          <span>切换到编辑后开始记录。</span>
        </div>
        <div v-else class="h_markdown_editor_preview_content" v-html="previewHtml"></div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

type MarkdownEditorMode = "edit" | "preview";

const EMPTY_EDITOR_HTML = "<p><br></p>";

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

const readonly = computed(() => props.readonly);
const dirty = computed(() => props.dirty);
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

const isBlankHtml = (html: string) => {
  const trimmedHtml = html.trim();

  if (!trimmedHtml || trimmedHtml === EMPTY_EDITOR_HTML) return true;

  const hasRichContent = /<(img|video|audio|table|ul|ol|blockquote|pre|code)\b/i.test(trimmedHtml);

  if (hasRichContent) return false;

  const text = trimmedHtml
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, "")
    .trim();

  return !text;
};

const isPreviewEmpty = computed(() => isBlankHtml(editorValue.value));
const previewHtml = computed(() => (isPreviewEmpty.value ? EMPTY_EDITOR_HTML : editorValue.value));

const syncReadonlyState = () => {
  if (readonly.value && editorMode.value === "edit") {
    editorMode.value = "preview";
  }

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

  editorMode.value = mode;

  if (mode === "edit") {
    await focusEditor();
  }
};

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
  syncReadonlyState();
};

const handleFocus = () => {
  if (!readonly.value) {
    editorMode.value = "edit";
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
  },
);

watch(
  () => props.mode,
  async (mode) => {
    if (mode === "edit" && !readonly.value) {
      await focusEditor();
    }
  },
);

watch(
  () => props.readonly,
  syncReadonlyState,
);

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  syncReadonlyState();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  editorRef.value?.destroy();
});
</script>

<style lang="scss" scoped src="./index.scss"></style>
