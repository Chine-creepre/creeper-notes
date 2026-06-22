import { defineStore } from "pinia";
import { computed, ref } from "vue";

const MESSAGE_LIMIT = 3;
const MESSAGE_DURATION = 2000;

type MessageType = "info" | "success" | "error" | "warning";

interface MessageItem {
  id: number;
  type: MessageType;
  content: string;
}

export const useMessageStore = defineStore("message", () => {
  const messages = ref<MessageItem[]>([]);
  let messageId = 0;

  const visibleMessages = computed(() => messages.value.slice(0, MESSAGE_LIMIT));

  const remove = (id: number): void => {
    messages.value = messages.value.filter((message) => message.id !== id);
  };

  const push = (type: MessageType, content: string): void => {
    const id = ++messageId;

    messages.value = [{ id, type, content }, ...messages.value].slice(0, MESSAGE_LIMIT);
    window.setTimeout(() => remove(id), MESSAGE_DURATION);
  };

  const info = (content: string): void => push("info", content);
  const success = (content: string): void => push("success", content);
  const error = (content: string): void => push("error", content);
  const warning = (content: string): void => push("warning", content);

  return {
    error,
    info,
    messages,
    remove,
    success,
    visibleMessages,
    warning,
  };
});
