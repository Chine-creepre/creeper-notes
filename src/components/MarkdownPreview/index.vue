<template>
  <article
    ref="previewRef"
    class="h_markdown_preview"
    tabindex="0"
    @focus="emit('activate')"
    @click="emit('activate')"
    v-html="previewHtml"
  ></article>
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import rust from "highlight.js/lib/languages/rust";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { computed, nextTick, onMounted, ref, watch } from "vue";

const EMPTY_PREVIEW_HTML = "<p><br></p>";
const CODE_LANGUAGE_CLASS_PREFIX = "language-";
const HIGHLIGHT_LANGUAGE_ALIAS: Record<string, string> = {
  cjs: "javascript",
  htm: "xml",
  html: "xml",
  js: "javascript",
  jsx: "javascript",
  md: "markdown",
  mjs: "javascript",
  rs: "rust",
  shell: "bash",
  sh: "bash",
  ts: "typescript",
  tsx: "typescript",
  vue: "xml",
  xml: "xml",
};

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  activate: [];
}>();

const previewRef = ref<HTMLElement>();
const previewHtml = computed(() => props.modelValue || EMPTY_PREVIEW_HTML);

const normalizeHighlightLanguage = (language: string | null) => {
  if (!language) return "";

  const normalizedLanguage = language.trim().toLowerCase();

  return HIGHLIGHT_LANGUAGE_ALIAS[normalizedLanguage] ?? normalizedLanguage;
};

const getCodeBlockLanguage = (codeBlock: HTMLElement) => {
  const classLanguage = Array.from(codeBlock.classList)
    .find((className) => className.startsWith(CODE_LANGUAGE_CLASS_PREFIX))
    ?.replace(CODE_LANGUAGE_CLASS_PREFIX, "");
  const dataLanguage = codeBlock.dataset.language ?? codeBlock.closest("pre")?.getAttribute("data-language");

  return normalizeHighlightLanguage(classLanguage ?? dataLanguage ?? "");
};

const highlightCodeBlock = (codeBlock: HTMLElement) => {
  const code = codeBlock.textContent ?? "";

  if (!code.trim()) return;

  const language = getCodeBlockLanguage(codeBlock);
  const result = language && hljs.getLanguage(language)
    ? hljs.highlight(code, { language, ignoreIllegals: true })
    : hljs.highlightAuto(code);

  codeBlock.innerHTML = result.value;
  codeBlock.classList.add("hljs");

  if (result.language) {
    codeBlock.classList.add(`${CODE_LANGUAGE_CLASS_PREFIX}${result.language}`);
  }
};

const highlightPreviewCode = async () => {
  await nextTick();
  previewRef.value?.querySelectorAll<HTMLElement>("pre code").forEach(highlightCodeBlock);
};

watch(
  previewHtml,
  async () => {
    await highlightPreviewCode();
  },
);

onMounted(async () => {
  await highlightPreviewCode();
});
</script>

<style lang="scss" scoped src="./index.scss"></style>
