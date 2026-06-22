import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { onBeforeUnmount, onMounted } from "vue";
import { APP_EVENTS } from "@/constants/events";
import { useFolderStore } from "@/stores/modules/folder";
import { useNoteStore } from "@/stores/modules/note";
import { useSystemStore } from "@/stores/modules/system";

interface OpenNotePayload {
  id?: string;
}

export const useBootstrap = () => {
  const folderStore = useFolderStore();
  const noteStore = useNoteStore();
  const systemStore = useSystemStore();
  const folderRefs = storeToRefs(folderStore);
  const noteRefs = storeToRefs(noteStore);
  const systemRefs = storeToRefs(systemStore);

  let unlistenFoldersChanged: UnlistenFn | undefined;
  let unlistenOpenNote: UnlistenFn | undefined;

  const selectFolder = async (node: Parameters<typeof folderStore.selectFolder>[0]): Promise<void> => {
    folderStore.selectFolder(node);
    noteStore.resetActiveNote();
    await noteStore.loadNotes();
  };

  onMounted(async () => {
    await folderStore.loadFolders();
    await noteStore.loadNotes();

    unlistenFoldersChanged = await listen(APP_EVENTS.foldersChanged, async () => {
      await folderStore.syncFoldersChanged();
      noteStore.resetActiveNote();
      await noteStore.loadNotes();
    });

    unlistenOpenNote = await listen<OpenNotePayload>("open-note", async (event) => {
      const noteId = event.payload?.id;

      if (!noteId) return;

      await noteStore.openNoteById(noteId);
    });
  });

  onBeforeUnmount(() => {
    unlistenFoldersChanged?.();
    unlistenOpenNote?.();
  });

  return {
    ...folderRefs,
    ...noteRefs,
    ...systemRefs,
    createNewNote: noteStore.createNewNote,
    deleteCurrentNote: noteStore.deleteCurrentNote,
    formatNoteTime: noteStore.formatNoteTime,
    getNoteDescription: noteStore.getNoteDescription,
    loadFolders: folderStore.loadFolders,
    loadNotes: noteStore.loadNotes,
    moveCurrentNoteToFolder: noteStore.moveCurrentNoteToFolder,
    openNoteById: noteStore.openNoteById,
    saveCurrentNote: noteStore.saveCurrentNote,
    selectFolder,
    selectNote: noteStore.selectNote,
    toggleCurrentNoteReadonly: noteStore.toggleCurrentNoteReadonly,
  };
};
