<script setup lang="ts">
import HWindowTitleBar from "@/components/HWindowTitleBar/index.vue";
import { useHAppLayout } from "./hook";

const {} = useHAppLayout();
</script>

<template>
  <div class="h_app_layout">
    <HWindowTitleBar />

    <main class="h_app_layout_content">
      <slot></slot>
    </main>
  </div>
</template>

<style lang="scss" scoped src="./index.scss"></style>
