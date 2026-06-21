<template>
  <section class="h_markdown_editor">
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
      <button type="button" title="编辑模式" :class="{ h_markdown_editor_toolbar_active: mode === 'edit' }" @click="mode = 'edit'">
        <Icon icon="lucide:pencil" />
      </button>
      <button type="button" title="预览模式" :class="{ h_markdown_editor_toolbar_active: mode === 'preview' }" @click="mode = 'preview'">
        <Icon icon="lucide:eye" />
      </button>
    </header>

    <textarea
      v-if="mode === 'edit'"
      ref="textareaRef"
      class="h_markdown_editor_input"
      :value="modelValue"
      :readonly="readonly"
      placeholder="使用 Markdown 记录内容..."
      @blur="focused = false"
      @focus="focused = true"
      @input="handleInput"
      @keydown="handleKeydown"
    ></textarea>

    <article v-else class="h_markdown_editor_preview" v-html="previewHtml"></article>
  </section>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref } from "vue";
import "./index.scss";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    dirty?: boolean;
  }>(),
  {
    readonly: false,
    dirty: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  save: [];
}>();

const mode = ref<"edit" | "preview">("edit");
const textareaRef = ref<HTMLTextAreaElement>();
const focused = ref(false);

const toolbarActions = [
  { icon: "lucide:heading-1", mark: "# ", title: "标题" },
  { icon: "lucide:bold", mark: "**加粗**", title: "加粗" },
  { icon: "lucide:italic", mark: "*斜体*", title: "斜体" },
  { icon: "lucide:list", mark: "- ", title: "列表" },
  { icon: "lucide:list-checks", mark: "- [ ] ", title: "任务" },
  { icon: "lucide:quote", mark: "> ", title: "引用" },
  { icon: "lucide:code", mark: "`code`", title: "代码" },
] as const;

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderInlineMarkdown = (value: string): string =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

const previewHtml = computed(() => {
  const lines = props.modelValue.split("\n");

  return lines
    .map((line) => {
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

const handleInput = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement | null;

  emit("update:modelValue", target?.value ?? "");
};

const handleKeydown = (event: KeyboardEvent): void => {
  if (!focused.value || !props.dirty) return;
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;

  event.preventDefault();
  event.stopPropagation();
  emit("save");
};

const insertMarkdown = async (mark: string): Promise<void> => {
  if (props.readonly) return;

  mode.value = "edit";
  await nextTick();

  const textarea = textareaRef.value;

  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const nextValue = `${props.modelValue.slice(0, start)}${mark}${props.modelValue.slice(end)}`;

  emit("update:modelValue", nextValue);

  await nextTick();
  textarea.focus();
  textarea.setSelectionRange(start + mark.length, start + mark.length);
};
</script>
