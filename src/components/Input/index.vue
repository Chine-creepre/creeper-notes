<template>
  <input v-model="model" class="h_input" :type="type" />
</template>

<script setup lang="ts">
import "./index.scss";

withDefaults(
  defineProps<{
    type?: string;
  }>(),
  {
    type: "text",
  },
);

const model = defineModel<string>({ default: "" });
</script>
