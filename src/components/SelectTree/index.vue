<template>
  <div class="h_select_tree">
    <button class="h_select_tree_trigger" type="button" @click="toggleOpen">
      <span>{{ selectedLabel }}</span>
      <Icon :icon="open ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
    </button>

    <div v-if="open" class="h_select_tree_popup">
      <button class="h_select_tree_root" type="button" @click="selectRoot">
        <Icon icon="lucide:folder-root" />
        <span>{{ rootLabel }}</span>
      </button>
      <HTree
        :nodes="nodes"
        :selected-key="modelValue"
        :default-expanded="defaultExpanded"
        :empty-text="emptyText"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import HTree from "@/components/Tree/index.vue";
import "./index.scss";
import type { HTreeNode, HTreeSelectedKey } from "@/components/Tree/types";

const props = withDefaults(
  defineProps<{
    modelValue: HTreeSelectedKey;
    nodes: HTreeNode[];
    placeholder?: string;
    rootLabel?: string;
    emptyText?: string;
    defaultExpanded?: boolean;
  }>(),
  {
    placeholder: "请选择",
    rootLabel: "根目录",
    emptyText: "暂无分类",
    defaultExpanded: true,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: HTreeSelectedKey];
  select: [node: HTreeNode | null];
}>();

const open = ref(false);

const findNodeLabel = (nodes: HTreeNode[], key: string): string | null => {
  for (const node of nodes) {
    if (node.id === key) return node.label;

    const childLabel = findNodeLabel(node.children ?? [], key);

    if (childLabel) return childLabel;
  }

  return null;
};

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.rootLabel || props.placeholder;

  return findNodeLabel(props.nodes, props.modelValue) ?? props.placeholder;
});

const toggleOpen = (): void => {
  open.value = !open.value;
};

const close = (): void => {
  open.value = false;
};

const selectRoot = (): void => {
  emit("update:modelValue", null);
  emit("select", null);
  close();
};

const handleSelect = (node: HTreeNode): void => {
  emit("update:modelValue", node.id);
  emit("select", node);
  close();
};
</script>
