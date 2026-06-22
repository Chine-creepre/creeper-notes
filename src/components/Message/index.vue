<template>
  <Teleport to="body">
    <section v-if="visibleMessages.length" class="h_message_stack" aria-live="polite">
      <div
        v-for="(message, index) in visibleMessages"
        :key="message.id"
        :class="['h_message_item', `h_message_item_${message.type}`]"
        :style="getMessageStyle(index)"
      >
        <span>{{ message.content }}</span>
      </div>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useMessageStore } from "@/stores/modules/message";
import "./index.scss";

const messageStore = useMessageStore();
const { visibleMessages } = storeToRefs(messageStore);

const getMessageStyle = (index: number): Record<string, string | number> => ({
  transform: `translateX(${index * 14}px)`,
  opacity: 1 - index * 0.22,
  zIndex: 10 - index,
});
</script>
