<template>
  <select v-model="model" class="h_select">
    <option v-if="placeholder" value="">{{ placeholder }}</option>
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import "./index.scss";

withDefaults(
  defineProps<{
    options: Array<{ label: string; value: string }>;
    placeholder?: string;
  }>(),
  {
    placeholder: "",
  },
);

const model = defineModel<string>({ default: "" });
</script>
