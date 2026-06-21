<template>
  <div class="h_tree" role="tree">
    <div v-if="!nodes.length" class="h_tree_empty">{{ emptyText }}</div>

    <div v-for="node in nodes" :key="node.id" class="h_tree_root">
      <HTreeNodeItem
        :node="node"
        :level="0"
        :selected-key="selectedKey"
        :default-expanded="defaultExpanded"
        :show-actions="showActions"
        @select="handleSelect"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import "./index.scss";
import HTreeNodeItem from "./node.vue";
import type { HTreeNode, HTreeSelectedKey } from "./types";

withDefaults(
  defineProps<{
    nodes: HTreeNode[];
    selectedKey?: HTreeSelectedKey;
    defaultExpanded?: boolean;
    emptyText?: string;
    showActions?: boolean;
  }>(),
  {
    selectedKey: null,
    defaultExpanded: true,
    emptyText: "暂无数据",
    showActions: false,
  },
);

const emit = defineEmits<{
  select: [node: HTreeNode];
  edit: [node: HTreeNode];
  delete: [node: HTreeNode];
}>();

const handleSelect = (node: HTreeNode): void => {
  emit("select", node);
};

const handleEdit = (node: HTreeNode): void => {
  emit("edit", node);
};

const handleDelete = (node: HTreeNode): void => {
  emit("delete", node);
};
</script>
