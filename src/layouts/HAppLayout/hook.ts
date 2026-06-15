import { listen } from "@tauri-apps/api/event";
import { onMounted, onUnmounted } from "vue";

interface OpenNotePayload {
  id: string;
}

export const useHAppLayout = () => {
  let unlistenOpenNote: (() => void) | undefined;

  const handleOpenNote = (payload: OpenNotePayload): void => {
    console.log("open-note", payload.id);
  };

  onMounted(async () => {
    unlistenOpenNote = await listen<OpenNotePayload>("open-note", (event) => {
      handleOpenNote(event.payload);
    });
  });

  onUnmounted(() => {
    unlistenOpenNote?.();
  });

  return {};
};
