<template>
  <article
    class="h_markdown_preview"
    tabindex="0"
    @focus="emit('activate')"
    @click="emit('activate')"
  >
    <MdPreview
      class="h_markdown_preview_content"
      :model-value="previewMarkdown"
      :editor-id="previewEditorId"
      language="zh-CN"
      theme="dark"
      preview-theme="github"
      code-theme="atom"
    />
  </article>
</template>

<script setup lang="ts">
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";
import { computed } from "vue";

const EMPTY_MARKDOWN = "";
const PREVIEW_EDITOR_ID = "h-markdown-preview";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  activate: [];
}>();

const previewMarkdown = computed(() => props.modelValue || EMPTY_MARKDOWN);
const previewEditorId = PREVIEW_EDITOR_ID;
</script>

<style lang="scss" scoped src="./index.scss"></style>
