<template>
  <article
    ref="previewRef"
    class="h_markdown_preview"
    tabindex="0"
    @focus="handlePreviewFocus"
    @click.capture="handlePreviewClick"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

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
let taskCheckboxObserver: MutationObserver | null = null;
let syncReadonlyTaskPending = false;
let syncReadonlyTaskTimer: number | undefined;

const isTaskCheckbox = (target: EventTarget | null): target is HTMLInputElement =>
  target instanceof HTMLInputElement && target.type === "checkbox";

const getTaskCheckboxes = (): HTMLInputElement[] =>
  Array.from(previewRef.value?.querySelectorAll<HTMLInputElement>(CHECKBOX_SELECTOR) ?? []);

const getTaskCheckboxIndex = (checkbox: HTMLInputElement): number =>
  getTaskCheckboxes().indexOf(checkbox);

const enableReadonlyTaskCheckboxes = () => {
  if (!props.readonly) return;

  getTaskCheckboxes().forEach((checkbox) => {
    checkbox.disabled = false;
    checkbox.readOnly = true;
    checkbox.removeAttribute("disabled");
    checkbox.removeAttribute("aria-disabled");
  });
};

const syncReadonlyTaskCheckboxes = async () => {
  if (syncReadonlyTaskPending) return;

  syncReadonlyTaskPending = true;
  await nextTick();
  enableReadonlyTaskCheckboxes();
  window.requestAnimationFrame(() => {
    enableReadonlyTaskCheckboxes();
    syncReadonlyTaskTimer = window.setTimeout(() => {
      syncReadonlyTaskPending = false;
      enableReadonlyTaskCheckboxes();
    });
  });
};

const observeTaskCheckboxes = () => {
  if (!previewRef.value) return;

  taskCheckboxObserver?.disconnect();
  taskCheckboxObserver = new MutationObserver(() => {
    syncReadonlyTaskCheckboxes();
  });
  taskCheckboxObserver.observe(previewRef.value, {
    attributes: true,
    attributeFilter: ["disabled", "aria-disabled"],
    childList: true,
    subtree: true,
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
  emit("toggleTask", getTaskCheckboxIndex(event.target), event.target.checked);
};

watch(previewMarkdown, syncReadonlyTaskCheckboxes);
watch(() => props.readonly, syncReadonlyTaskCheckboxes);

onMounted(() => {
  observeTaskCheckboxes();
  syncReadonlyTaskCheckboxes();
});

onBeforeUnmount(() => {
  taskCheckboxObserver?.disconnect();

  if (syncReadonlyTaskTimer) {
    window.clearTimeout(syncReadonlyTaskTimer);
  }
});
</script>

<style lang="scss" scoped src="./index.scss"></style>
