<template>
  <div class=""></div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

interface Props {}

interface Views {}

const props = withDefaults(defineProps<Props>(), {});

const views = reactive<Views>({});
</script>

<style lang="scss" scoped></style>
