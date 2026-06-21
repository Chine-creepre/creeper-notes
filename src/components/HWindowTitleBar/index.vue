<script setup lang="ts">
import { useHWindowTitleBar } from "./hook";

const { startDragWindow } = useHWindowTitleBar();
</script>

<template>
  <header class="h_window_title_bar">
    <div
      class="h_window_title_bar_drag"
      @mousedown.left="startDragWindow">
      <span class="h_window_title_bar_dots">
        <i class="h_window_title_bar_dot h_window_title_bar_dot_close"></i>
        <i class="h_window_title_bar_dot h_window_title_bar_dot_minimize"></i>
        <i class="h_window_title_bar_dot h_window_title_bar_dot_zoom"></i>
      </span>
      <span class="h_window_title_bar_title">creeper-notes · 本地笔记系统</span>
      <span class="h_window_title_bar_shortcut">Ctrl+N</span>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./index.scss"></style>
