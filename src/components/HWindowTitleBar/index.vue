<script setup lang="ts">
import { computed, useSlots } from "vue";
import { useHWindowTitleBar } from "./hook";

withDefaults(
  defineProps<{
    title?: string;
    rightText?: string;
  }>(),
  {
    title: "",
    rightText: "",
  },
);

const slots = useSlots();
const hasRightActions = computed(() => Boolean(slots.right));
const { startDragWindow } = useHWindowTitleBar();
</script>

<template>
  <header class="h_window_title_bar">
    <div
      class="h_window_title_bar_drag"
      @mousedown.left="startDragWindow">
      <span v-if="title" class="h_window_title_bar_current_note">{{ title }}</span>

      <div v-if="rightText || hasRightActions" class="h_window_title_bar_right" @mousedown.stop>
        <span v-if="rightText" class="h_window_title_bar_right_text">{{ rightText }}</span>
        <span v-if="rightText && hasRightActions" class="h_window_title_bar_separator"></span>
        <slot name="right"></slot>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./index.scss"></style>
