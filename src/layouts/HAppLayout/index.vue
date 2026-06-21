<script setup lang="ts">
import HWindowTitleBar from "@/components/HWindowTitleBar/index.vue";
import { useHAppLayout } from "./hook";

withDefaults(
  defineProps<{
    title?: string;
    titleRightText?: string;
  }>(),
  {
    title: "",
    titleRightText: "",
  },
);

const {} = useHAppLayout();
</script>

<template>
  <div class="h_app_layout">
    <HWindowTitleBar :right-text="titleRightText" :title="title" />

    <main class="h_app_layout_content">
      <slot></slot>
    </main>
  </div>
</template>

<style lang="scss" scoped src="./index.scss"></style>
