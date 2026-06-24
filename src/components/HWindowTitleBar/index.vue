<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, useSlots } from "vue";
import appIconSrc from "@/assets/icons/32x32.png";
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
const { closeToTray, startDragWindow, toggleFullscreen } = useHWindowTitleBar();
</script>

<template>
  <header class="h_window_title_bar">
    <div
      class="h_window_title_bar_drag"
      @mousedown.left="startDragWindow"
      @dblclick.left.stop="toggleFullscreen">
      <div class="h_window_title_bar_left">
        <img class="h_window_title_bar_icon" :src="appIconSrc" alt="Creeper Notes" draggable="false" />
        <span v-if="title" class="h_window_title_bar_current_note">{{ title }}</span>
      </div>

      <div class="h_window_title_bar_right" @mousedown.stop @dblclick.stop>
        <template v-if="rightText || hasRightActions">
          <span v-if="rightText" class="h_window_title_bar_right_text">{{ rightText }}</span>
          <span v-if="rightText && hasRightActions" class="h_window_title_bar_separator"></span>
          <slot name="right"></slot>
          <span class="h_window_title_bar_separator"></span>
        </template>

        <button class="h_window_title_bar_window_action" type="button" title="全屏" @click="toggleFullscreen">
          <Icon icon="lucide:maximize" />
        </button>
        <button class="h_window_title_bar_window_action h_window_title_bar_window_action_close" type="button" title="关闭到托盘" @click="closeToTray">
          <Icon icon="lucide:x" />
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./index.scss"></style>
