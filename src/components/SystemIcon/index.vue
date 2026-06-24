<script setup lang="ts">
import appIconSrc from "@/assets/icons/32x32.png";

withDefaults(
  defineProps<{
    alt?: string;
  }>(),
  {
    alt: "Creeper Notes",
  },
);
</script>

<template>
  <img class="h_system_icon" :src="appIconSrc" :alt="alt" draggable="false" />
</template>

<style lang="scss" scoped src="./index.scss"></style>
