<script setup lang="ts">
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

const { startDragWindow } = useHWindowTitleBar();
</script>

<template>
  <header class="h_window_title_bar">
    <div
      class="h_window_title_bar_drag"
      @mousedown.left="startDragWindow">
      <span v-if="title" class="h_window_title_bar_current_note">{{ title }}</span>
      <span v-if="rightText" class="h_window_title_bar_right_text">{{ rightText }}</span>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./index.scss"></style>
