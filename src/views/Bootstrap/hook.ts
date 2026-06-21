import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted } from "vue";
import { useSystemStore } from "@/stores/modules/system";

interface OpenNotePayload {
  id?: string;
}

export const useBootstrap = () => {
  const systemStore = useSystemStore();
  const systemRefs = storeToRefs(systemStore);

  let unlistenOpenNote: UnlistenFn | undefined;

  onMounted(async () => {
    await systemStore.initializeSystemData();

    unlistenOpenNote = await listen<OpenNotePayload>("open-note", async (event) => {
      const noteId = event.payload?.id;

      if (!noteId) return;

      await systemStore.openNoteById(noteId);
    });
  });

  onBeforeUnmount(() => {
    unlistenOpenNote?.();
  });

  return {
    ...systemRefs,
    clearSearch: systemStore.clearSearch,
    createNewNote: systemStore.createNewNote,
    deleteCurrentNote: systemStore.deleteCurrentNote,
    formatNoteTime: systemStore.formatNoteTime,
    getNoteDescription: systemStore.getNoteDescription,
    loadFolders: systemStore.loadFolders,
    loadNotes: systemStore.loadNotes,
    moveCurrentNoteToFolder: systemStore.moveCurrentNoteToFolder,
    openNoteById: systemStore.openNoteById,
    saveCurrentNote: systemStore.saveCurrentNote,
    searchCurrentNotes: systemStore.searchCurrentNotes,
    selectFolder: systemStore.selectFolder,
    selectNote: systemStore.selectNote,
  };
};
