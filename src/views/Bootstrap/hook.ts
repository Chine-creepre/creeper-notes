import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted } from "vue";
import { APP_EVENTS } from "@/constants/events";
import { useSystemStore } from "@/stores/modules/system";

interface OpenNotePayload {
  id?: string;
}

export const useBootstrap = () => {
  const systemStore = useSystemStore();
  const systemRefs = storeToRefs(systemStore);

  let unlistenOpenNote: UnlistenFn | undefined;

  const syncFoldersChanged = async (): Promise<void> => {
    await systemStore.loadFolders();
    await systemStore.loadNotes();
  };

  onMounted(async () => {
    await systemStore.initializeSystemData();
    window.addEventListener(APP_EVENTS.foldersChanged, syncFoldersChanged);

    unlistenOpenNote = await listen<OpenNotePayload>("open-note", async (event) => {
      const noteId = event.payload?.id;

      if (!noteId) return;

      await systemStore.openNoteById(noteId);
    });
  });

  onBeforeUnmount(() => {
    window.removeEventListener(APP_EVENTS.foldersChanged, syncFoldersChanged);
    unlistenOpenNote?.();
  });

  return {
    ...systemRefs,
    createNewNote: systemStore.createNewNote,
    deleteCurrentNote: systemStore.deleteCurrentNote,
    formatNoteTime: systemStore.formatNoteTime,
    getNoteDescription: systemStore.getNoteDescription,
    loadFolders: systemStore.loadFolders,
    loadNotes: systemStore.loadNotes,
    moveCurrentNoteToFolder: systemStore.moveCurrentNoteToFolder,
    openNoteById: systemStore.openNoteById,
    saveCurrentNote: systemStore.saveCurrentNote,
    selectFolder: systemStore.selectFolder,
    selectNote: systemStore.selectNote,
    toggleCurrentNoteReadonly: systemStore.toggleCurrentNoteReadonly,
  };
};
