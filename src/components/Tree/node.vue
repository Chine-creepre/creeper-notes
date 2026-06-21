<template>
  <div class="h_tree_node" :class="{ h_tree_node_leaf: !hasChildren }" role="treeitem" :aria-expanded="hasChildren ? expanded : undefined">
    <div
      :class="[
        'h_tree_node_content',
        {
          h_tree_node_content_active: selectedKey === node.id,
          h_tree_node_content_disabled: node.disabled,
        },
      ]"
      :style="{ paddingLeft: `${level * 18 + 8}px` }"
      @click="handleSelect"
    >
      <button v-if="hasChildren" class="h_tree_node_toggle" type="button" @click.stop="toggleExpanded">
        <Icon :icon="expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" />
      </button>
      <span v-else class="h_tree_node_toggle h_tree_node_toggle_placeholder"></span>

      <Icon class="h_tree_node_icon" :icon="node.icon || 'lucide:folder'" />
      <span class="h_tree_node_label" :title="node.label">{{ node.label }}</span>
    </div>

    <div v-if="hasChildren && expanded" class="h_tree_node_children" role="group">
      <HTreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :selected-key="selectedKey"
        :default-expanded="defaultExpanded"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import type { HTreeNode, HTreeSelectedKey } from "./types";

const props = withDefaults(
  defineProps<{
    node: HTreeNode;
    level: number;
    selectedKey?: HTreeSelectedKey;
    defaultExpanded?: boolean;
  }>(),
  {
    selectedKey: null,
    defaultExpanded: true,
  },
);

const emit = defineEmits<{
  select: [node: HTreeNode];
}>();

const expanded = ref(props.defaultExpanded);
const hasChildren = computed(() => Boolean(props.node.children?.length));

const toggleExpanded = (): void => {
  expanded.value = !expanded.value;
};

const handleSelect = (): void => {
  if (props.node.disabled) return;

  emit("select", props.node);
};
</script>
