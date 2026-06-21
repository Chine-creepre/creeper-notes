<template>
  <div
    class="h_tree_node"
    :class="{
      h_tree_node_leaf: !hasChildren,
      h_tree_node_root: level === 0,
    }"
    :style="treeNodeStyle"
    role="treeitem"
    :aria-expanded="hasChildren ? expanded : undefined"
  >
    <div
      :class="[
        'h_tree_node_content',
        {
          h_tree_node_content_active: selectedKey === node.id,
          h_tree_node_content_disabled: node.disabled,
        },
      ]"
      :style="treeNodeContentStyle"
      @click="handleSelect"
    >
      <button v-if="hasChildren" class="h_tree_node_toggle" type="button" @click.stop="toggleExpanded">
        <Icon :icon="expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" />
      </button>
      <span v-else class="h_tree_node_toggle h_tree_node_toggle_placeholder"></span>

      <Icon class="h_tree_node_icon" :icon="node.icon || 'lucide:folder'" />
      <span class="h_tree_node_label" :title="node.label">{{ node.label }}</span>

      <span v-if="showActions" class="h_tree_node_actions">
        <button v-if="node.editable !== false" class="h_tree_node_action" type="button" title="编辑" @click.stop="handleEdit">
          <Icon icon="lucide:pencil" />
        </button>
        <button v-if="node.deletable !== false" class="h_tree_node_action h_tree_node_action_danger" type="button" title="删除" @click.stop="handleDelete">
          <Icon icon="lucide:trash-2" />
        </button>
      </span>
    </div>

    <div v-if="hasChildren && expanded" class="h_tree_node_children" role="group">
      <HTreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :selected-key="selectedKey"
        :default-expanded="defaultExpanded"
        :show-actions="showActions"
        @select="emit('select', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "HTreeNodeItem",
});

import { Icon } from "@iconify/vue";
import { computed, ref, type CSSProperties } from "vue";
import type { HTreeNode, HTreeSelectedKey } from "./types";

const TREE_INDENT_SIZE = 18;
const TREE_CONTENT_BASE_PADDING = 8;
const TREE_LINE_OFFSET = 19;

const props = withDefaults(
  defineProps<{
    node: HTreeNode;
    level: number;
    selectedKey?: HTreeSelectedKey;
    defaultExpanded?: boolean;
    showActions?: boolean;
  }>(),
  {
    selectedKey: null,
    defaultExpanded: true,
    showActions: false,
  },
);

const emit = defineEmits<{
  select: [node: HTreeNode];
  edit: [node: HTreeNode];
  delete: [node: HTreeNode];
}>();

const expanded = ref(props.defaultExpanded);
const hasChildren = computed(() => Boolean(props.node.children?.length));

const treeNodeStyle = computed<CSSProperties>(() => ({
  "--h_tree_line_left": `${props.level * TREE_INDENT_SIZE + TREE_LINE_OFFSET}px`,
}));

const treeNodeContentStyle = computed<CSSProperties>(() => ({
  paddingLeft: `${props.level * TREE_INDENT_SIZE + TREE_CONTENT_BASE_PADDING}px`,
}));

const toggleExpanded = (): void => {
  expanded.value = !expanded.value;
};

const handleSelect = (): void => {
  if (props.node.disabled) return;

  emit("select", props.node);
};

const handleEdit = (): void => {
  if (props.node.disabled) return;

  emit("edit", props.node);
};

const handleDelete = (): void => {
  if (props.node.disabled) return;

  emit("delete", props.node);
};
</script>
