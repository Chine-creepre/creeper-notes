<template>
  <section class="h_markdown_editor" @focusin="enterEditMode">
    <header class="h_markdown_editor_toolbar">
      <button
        v-for="action in toolbarActions"
        :key="action.mark"
        type="button"
        :title="action.title"
        @click="insertMarkdown(action.mark)"
      >
        <Icon :icon="action.icon" />
      </button>
      <span></span>
      <button type="button" title="编辑模式" :class="{ h_markdown_editor_toolbar_active: editorMode === 'edit' }" @click="setEditorMode('edit')">
        <Icon icon="lucide:pencil" />
      </button>
      <button type="button" title="预览模式" :class="{ h_markdown_editor_toolbar_active: editorMode === 'preview' }" @click="setEditorMode('preview')">
        <Icon icon="lucide:eye" />
      </button>
    </header>

    <div v-show="editorMode === 'edit'" ref="editorRootRef" class="h_markdown_editor_codemirror"></div>
    <article v-show="editorMode === 'preview'" class="h_markdown_editor_preview" tabindex="0" @focus="enterEditMode" @click="enterEditMode" v-html="previewHtml"></article>
  </section>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, placeholder, type ViewUpdate } from "@codemirror/view";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import "./index.scss";

type MarkdownEditorMode = "edit" | "preview";

interface ToolbarAction {
  icon: string;
  mark: string;
  title: string;
}

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

const editorRootRef = ref<HTMLDivElement>();
const editorView = ref<EditorView>();
const isEditorFocused = ref(false);

const editorMode = computed<MarkdownEditorMode>({
  get: () => props.mode,
  set: (value) => emit("update:mode", value),
});

const toolbarActions: ToolbarAction[] = [
  { icon: "lucide:heading-1", mark: "# ", title: "一级标题" },
  { icon: "lucide:heading-2", mark: "## ", title: "二级标题" },
  { icon: "lucide:heading-3", mark: "### ", title: "三级标题" },
  { icon: "lucide:heading-4", mark: "#### ", title: "四级标题" },
  { icon: "lucide:heading-5", mark: "##### ", title: "五级标题" },
  { icon: "lucide:bold", mark: "**加粗**", title: "加粗" },
  { icon: "lucide:italic", mark: "*斜体*", title: "斜体" },
  { icon: "lucide:list", mark: "- ", title: "列表" },
  { icon: "lucide:list-checks", mark: "- [ ] ", title: "任务" },
  { icon: "lucide:quote", mark: "> ", title: "引用" },
  { icon: "lucide:code", mark: "`code`", title: "代码" },
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderInlineMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");

const previewHtml = computed(() => {
  const lines = props.modelValue.split("\n");

  return lines
    .map((line) => {
      if (line.startsWith("##### ")) return `<h5>${renderInlineMarkdown(line.slice(6))}</h5>`;
      if (line.startsWith("#### ")) return `<h4>${renderInlineMarkdown(line.slice(5))}</h4>`;
      if (line.startsWith("### ")) return `<h3>${renderInlineMarkdown(line.slice(4))}</h3>`;
      if (line.startsWith("## ")) return `<h2>${renderInlineMarkdown(line.slice(3))}</h2>`;
      if (line.startsWith("# ")) return `<h1>${renderInlineMarkdown(line.slice(2))}</h1>`;
      if (line.startsWith("> ")) return `<blockquote>${renderInlineMarkdown(line.slice(2))}</blockquote>`;
      if (line.startsWith("- [ ] ")) return `<p><input type="checkbox" disabled /> ${renderInlineMarkdown(line.slice(6))}</p>`;
      if (line.startsWith("- [x] ")) return `<p><input type="checkbox" checked disabled /> ${renderInlineMarkdown(line.slice(6))}</p>`;
      if (line.startsWith("- ")) return `<p>• ${renderInlineMarkdown(line.slice(2))}</p>`;
      if (!line.trim()) return "<br />";

      return `<p>${renderInlineMarkdown(line)}</p>`;
    })
    .join("");
});

const createEditorTheme = (): Extension =>
  EditorView.theme({
    "&": {
      height: "100%",
      background: "transparent",
      color: "var(--h_window_text_secondary)",
      fontSize: "13px",
    },
    ".cm-scroller": {
      fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif",
      lineHeight: "1.8",
    },
    ".cm-content": {
      minHeight: "100%",
      padding: "22px",
      caretColor: "var(--h_color_primary)",
    },
    ".cm-line": {
      padding: "0",
    },
    ".cm-gutters": {
      borderRight: "1px solid var(--h_window_border)",
      background: "color-mix(in srgb, var(--h_window_surface_deep) 32%, transparent)",
      color: "var(--h_window_text_muted)",
    },
    ".cm-activeLine": {
      background: "color-mix(in srgb, var(--h_color_primary) 8%, transparent)",
    },
    ".cm-activeLineGutter": {
      background: "color-mix(in srgb, var(--h_color_primary) 10%, transparent)",
      color: "var(--h_color_primary)",
    },
    ".cm-selectionBackground": {
      background: "color-mix(in srgb, var(--h_color_primary) 24%, transparent) !important",
    },
    ".cm-placeholder": {
      color: "var(--h_window_text_muted)",
    },
    "&.cm-focused": {
      outline: "none",
    },
  });

const syncEditorDocument = (value: string) => {
  const view = editorView.value;

  if (!view) return;
  if (view.state.doc.toString() === value) return;

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: value,
    },
  });
};

const focusEditor = async () => {
  await nextTick();
  editorView.value?.focus();
};

const handleSaveShortcut = () => {
  emit("save");
  return true;
};

const handleEditorUpdate = (update: ViewUpdate) => {
  if (update.focusChanged) {
    isEditorFocused.value = update.view.hasFocus;

    if (!update.view.hasFocus && !props.dirty) {
      editorMode.value = "preview";
    }
  }

  if (update.docChanged) {
    emit("update:modelValue", update.state.doc.toString());
  }
};

const createEditorState = () =>
  EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      history(),
      markdown(),
      syntaxHighlighting(defaultHighlightStyle),
      placeholder("使用 Markdown 记录内容..."),
      keymap.of([
        { key: "Mod-s", run: handleSaveShortcut },
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      EditorView.editable.of(!props.readonly),
      EditorView.updateListener.of(handleEditorUpdate),
      createEditorTheme(),
    ],
  });

const createEditor = () => {
  const root = editorRootRef.value;

  if (!root) return;

  editorView.value?.destroy();
  editorView.value = new EditorView({
    state: createEditorState(),
    parent: root,
  });
};

const rebuildEditor = async () => {
  await nextTick();
  createEditor();
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

const insertMarkdown = async (mark: string) => {
  if (props.readonly) return;

  editorMode.value = "edit";
  await focusEditor();

  const view = editorView.value;

  if (!view) return;

  const range = view.state.selection.main;

  view.dispatch({
    changes: {
      from: range.from,
      to: range.to,
      insert: mark,
    },
    selection: {
      anchor: range.from + mark.length,
    },
  });
  view.focus();
};

watch(
  () => props.modelValue,
  (value) => syncEditorDocument(value),
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
  async () => {
    await rebuildEditor();
  },
);

onMounted(createEditor);

onBeforeUnmount(() => {
  editorView.value?.destroy();
});
</script>
