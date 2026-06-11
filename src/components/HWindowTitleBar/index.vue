<script setup lang="ts">
import { useHWindowTitleBar } from "./hook";

const { startDragWindow } = useHWindowTitleBar();
</script>

<template>
  <header class="h_window_title_bar">
    <div class="h_window_title_bar_drag" @mousedown.left="startDragWindow">
      <span class="h_window_title_bar_title">
        creeper-notes
      </span>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./index.scss"></style>
