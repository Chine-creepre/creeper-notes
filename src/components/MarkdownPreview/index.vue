<template>
  <article
    ref="previewRef"
    class="h_markdown_preview"
    tabindex="0"
    @focus="handlePreviewFocus"
    @click="handlePreviewClick"
    @change.capture="handlePreviewChange"
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
import { computed, nextTick, onMounted, watch } from "vue";

const EMPTY_MARKDOWN = "";
const PREVIEW_EDITOR_ID = "h-markdown-preview";
const CHECKBOX_SELECTOR = 'input[type="checkbox"]';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  },
);

const emit = defineEmits<{
  activate: [];
  toggleTask: [index: number, checked: boolean];
}>();

const previewRef = ref<HTMLElement>();
const previewMarkdown = computed(() => props.modelValue || EMPTY_MARKDOWN);
const previewEditorId = PREVIEW_EDITOR_ID;

const isTaskCheckbox = (target: EventTarget | null): target is HTMLInputElement =>
  target instanceof HTMLInputElement && target.type === "checkbox";

const getTaskCheckboxes = (): HTMLInputElement[] =>
  Array.from(previewRef.value?.querySelectorAll<HTMLInputElement>(CHECKBOX_SELECTOR) ?? []);

const getTaskCheckboxIndex = (checkbox: HTMLInputElement): number =>
  getTaskCheckboxes().indexOf(checkbox);

const syncReadonlyTaskCheckboxes = async () => {
  await nextTick();

  if (!props.readonly) return;

  getTaskCheckboxes().forEach((checkbox) => {
    checkbox.disabled = false;
    checkbox.removeAttribute("disabled");
  });
};

const handlePreviewFocus = () => {
  if (props.readonly) return;

  emit("activate");
};

const handlePreviewClick = (event: MouseEvent) => {
  if (!props.readonly) {
    emit("activate");
    return;
  }

  if (!isTaskCheckbox(event.target)) return;

  event.stopPropagation();
};

const handlePreviewChange = (event: Event) => {
  if (!props.readonly) return;
  if (!isTaskCheckbox(event.target)) return;

  event.stopPropagation();
  emit("toggleTask", getTaskCheckboxIndex(event.target), event.target.checked);
};

watch(previewMarkdown, syncReadonlyTaskCheckboxes);
watch(() => props.readonly, syncReadonlyTaskCheckboxes);

onMounted(syncReadonlyTaskCheckboxes);
</script>

<style lang="scss" scoped src="./index.scss"></style>
