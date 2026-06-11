<script setup lang="ts">
import { useHWindowTitleBar } from "./hook";

const { minimizeWindow, toggleMaximizeWindow, closeWindow } = useHWindowTitleBar();
</script>

<template>
  <header class="h_window_title_bar">
    <div class="h_window_title_bar_drag" data-tauri-drag-region>
      <span class="h_window_title_bar_title" data-tauri-drag-region>
        creeper-notes
      </span>
    </div>

    <div class="h_window_title_bar_actions">
      <button class="h_window_title_bar_action" type="button" aria-label="Minimize" @click="minimizeWindow">
        —
      </button>
      <button class="h_window_title_bar_action" type="button" aria-label="Maximize" @click="toggleMaximizeWindow">
        □
      </button>
      <button class="h_window_title_bar_action h_window_title_bar_action_close" type="button" aria-label="Close" @click="closeWindow">
        ×
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./index.scss"></style>
