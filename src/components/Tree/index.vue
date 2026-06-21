<template>
  <div class="h_tree" role="tree">
    <div v-if="!nodes.length" class="h_tree_empty">{{ emptyText }}</div>

    <div v-for="node in nodes" :key="node.id" class="h_tree_root">
      <HTreeNodeItem
        :node="node"
        :level="0"
        :selected-key="selectedKey"
        :default-expanded="defaultExpanded"
        @select="handleSelect"
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
  }>(),
  {
    selectedKey: null,
    defaultExpanded: true,
    emptyText: "暂无数据",
  },
);

const emit = defineEmits<{
  select: [node: HTreeNode];
}>();

const handleSelect = (node: HTreeNode): void => {
  emit("select", node);
};
</script>
