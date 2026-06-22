<template>
  <Teleport to="body">
    <div v-if="modelValue" class="h_modal" @keydown.esc="emitClose">
      <div class="h_modal_mask" @click="emitClose"></div>
      <section class="h_modal_panel" role="dialog" aria-modal="true" :aria-label="title">
        <header class="h_modal_header">
          <strong>{{ title }}</strong>
          <button type="button" title="关闭" @click="emitClose">
            <Icon icon="lucide:x" />
          </button>
        </header>

        <main class="h_modal_body">
          <slot></slot>
        </main>

        <footer class="h_modal_footer">
          <button class="h_modal_cancel" type="button" @click="emitClose">取消</button>
          <button class="h_modal_confirm" type="button" :disabled="confirmDisabled" @click="emitConfirm">确认</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import "./index.scss";

withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    confirmDisabled?: boolean;
  }>(),
  {
    confirmDisabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
  confirm: [];
}>();

const emitClose = (): void => {
  emit("update:modelValue", false);
  emit("close");
};

const emitConfirm = (): void => {
  emit("confirm");
};
</script>
