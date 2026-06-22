<template>
  <span :class="['h_themed_icon', { h_themed_icon_active: active }]">
    <Icon :icon="icon" />
  </span>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import "./index.scss";

withDefaults(
  defineProps<{
    icon: string;
    active?: boolean;
  }>(),
  {
    active: false,
  },
);
</script>
