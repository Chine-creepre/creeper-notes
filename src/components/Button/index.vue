<template>
  <button :class="['h_button', `h_button_${variant}`, `h_button_${size}`, { h_button_block: block }]" :type="type">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import "./index.scss";

withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md";
    block?: boolean;
  }>(),
  {
    type: "button",
    variant: "primary",
    size: "md",
    block: false,
  },
);
</script>
