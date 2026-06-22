<template>
  <textarea v-model="model" class="h_textarea"></textarea>
</template>

<script setup lang="ts">
import "./index.scss";

const model = defineModel<string>({ default: "" });
</script>
