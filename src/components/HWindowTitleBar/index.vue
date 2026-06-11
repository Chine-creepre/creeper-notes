<script setup lang="ts">
import { useHWindowTitleBar } from "./hook";

const {} = useHWindowTitleBar();
</script>

<template>
  <header
    class="h_window_title_bar"
    data-tauri-drag-region>
    <div class="h_window_title_bar_drag">
      <span class="h_window_title_bar_title"> creeper-notes </span>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./index.scss"></style>
