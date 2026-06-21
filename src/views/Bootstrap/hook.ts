import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import type { HTreeNode } from "@/components/Tree/types";
import {
  createNote,
  deleteNote,
  findNoteById,
  listFolderTree,
  listNotes,
  moveNoteToFolder,
  updateNote,
  type FolderTreeNode,
  type Note,
} from "@/request/apis/notes";

const NOTE_PAGE_SIZE = 50;
const ROOT_FOLDER_KEY = "__root__";
const ALL_NOTES_KEY = "__all__";
const DEFAULT_NOTE_TITLE = "未命名笔记";
const FOLDER_TREE_ICON = "lucide:folder";

interface OpenNotePayload {
  id?: string;
}

const mapFolderToTreeNode = (folder: FolderTreeNode): HTreeNode => ({
  id: folder.id,
  label: folder.name,
  icon: FOLDER_TREE_ICON,
  raw: folder,
  children: folder.children.map(mapFolderToTreeNode),
});

const getCurrentTime = (): number => Date.now();

const getNoteDescription = (note: Note): string => {
  if (note.describe?.trim()) return note.describe;
  if (note.content?.trim()) return note.content;

  return "暂无内容";
};

const normalizeDraftTitle = (title: string): string => {
  const trimmedTitle = title.trim();

  return trimmedTitle || DEFAULT_NOTE_TITLE;
};

export const useBootstrap = () => {
  const folders = ref<FolderTreeNode[]>([]);
  const notes = ref<Note[]>([]);
  const activeFolderKey = ref<string>(ALL_NOTES_KEY);
  const activeNoteId = ref<string | null>(null);
  const newNoteFolderId = ref<string | null>(null);
  const loadingNotes = ref(false);
  const saving = ref(false);
  const keyword = ref("");
  const statusMessage = ref("");

  const draft = reactive({
    title: "",
    describe: "",
    content: "",
    readonly: false,
    folderId: null as string | null,
  });

  let unlistenOpenNote: UnlistenFn | undefined;
  let statusTimer: number | undefined;

  const folderTreeNodes = computed<HTreeNode[]>(() => [
    {
      id: ALL_NOTES_KEY,
      label: "全部笔记",
      icon: "lucide:library-big",
      children: [],
    },
    {
      id: ROOT_FOLDER_KEY,
      label: "根目录",
      icon: "lucide:folder-root",
      children: [],
    },
    ...folders.value.map(mapFolderToTreeNode),
  ]);

  const newNoteFolderTreeNodes = computed<HTreeNode[]>(() => folders.value.map(mapFolderToTreeNode));
  const selectedNote = computed(() => notes.value.find((note) => note.id === activeNoteId.value) ?? null);
  const noteCountText = computed(() => `${notes.value.length} 条笔记`);
  const activeFolderId = computed(() => {
    if (activeFolderKey.value === ALL_NOTES_KEY) return undefined;
    if (activeFolderKey.value === ROOT_FOLDER_KEY) return null;

    return activeFolderKey.value;
  });

  const clearStatusMessage = (): void => {
    if (statusTimer) {
      window.clearTimeout(statusTimer);
      statusTimer = undefined;
    }

    statusMessage.value = "";
  };

  const showStatusMessage = (message: string): void => {
    clearStatusMessage();
    statusMessage.value = message;
    statusTimer = window.setTimeout(clearStatusMessage, 1800);
  };

  const syncDraft = (note: Note | null): void => {
    draft.title = note?.title ?? "";
    draft.describe = note?.describe ?? "";
    draft.content = note?.content ?? "";
    draft.readonly = note?.readonly ?? false;
    draft.folderId = note?.folder_id ?? null;
  };

  const loadFolders = async (): Promise<void> => {
    folders.value = await listFolderTree();
  };

  const loadNotes = async (): Promise<void> => {
    loadingNotes.value = true;

    try {
      const trimmedKeyword = keyword.value.trim();
      const query = trimmedKeyword
        ? {
            keyword: trimmedKeyword,
            page: 1,
            page_size: NOTE_PAGE_SIZE,
          }
        : {
            folder_id: typeof activeFolderId.value === "string" ? activeFolderId.value : null,
            root_only: activeFolderId.value === null,
            page: 1,
            page_size: NOTE_PAGE_SIZE,
          };

      const result = await listNotes(query);
      notes.value = result.items;

      if (!notes.value.some((note) => note.id === activeNoteId.value)) {
        activeNoteId.value = notes.value[0]?.id ?? null;
      }

      syncDraft(selectedNote.value);
    } finally {
      loadingNotes.value = false;
    }
  };

  const selectFolder = async (node: HTreeNode): Promise<void> => {
    activeFolderKey.value = node.id;
    activeNoteId.value = null;
    keyword.value = "";
    await loadNotes();
  };

  const selectNewNoteFolder = async (): Promise<void> => {
    activeFolderKey.value = newNoteFolderId.value ?? ROOT_FOLDER_KEY;
    activeNoteId.value = null;
    keyword.value = "";
    await loadNotes();
  };

  const selectNote = (note: Note): void => {
    activeNoteId.value = note.id;
    syncDraft(note);
  };

  const createNewNote = async (): Promise<void> => {
    const note = await createNote({
      title: DEFAULT_NOTE_TITLE,
      describe: null,
      content: "",
      readonly: false,
      folder_id: newNoteFolderId.value,
    });

    activeFolderKey.value = note.folder_id ?? ROOT_FOLDER_KEY;
    notes.value = [note, ...notes.value];
    selectNote(note);
    showStatusMessage("已新建笔记");
  };

  const saveCurrentNote = async (): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote) return;

    saving.value = true;

    try {
      const updatedNote = await updateNote({
        id: currentNote.id,
        title: normalizeDraftTitle(draft.title),
        describe: draft.describe.trim() || null,
        content: draft.content,
        readonly: draft.readonly,
        folder_id: draft.folderId,
      });

      notes.value = notes.value.map((note) => (note.id === updatedNote.id ? updatedNote : note));
      selectNote(updatedNote);
      showStatusMessage("已保存");
    } finally {
      saving.value = false;
    }
  };

  const deleteCurrentNote = async (): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote) return;

    await deleteNote(currentNote.id);
    notes.value = notes.value.filter((note) => note.id !== currentNote.id);
    activeNoteId.value = notes.value[0]?.id ?? null;
    syncDraft(selectedNote.value);
    showStatusMessage("已删除笔记");
  };

  const moveCurrentNoteToFolder = async (folderId: string | null): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote) return;

    const updatedNote = await moveNoteToFolder(currentNote.id, folderId);
    notes.value = notes.value.map((note) => (note.id === updatedNote.id ? updatedNote : note));
    selectNote(updatedNote);
    showStatusMessage("已移动笔记");
  };

  const searchCurrentNotes = async (): Promise<void> => {
    activeNoteId.value = null;
    await loadNotes();
  };

  const clearSearch = async (): Promise<void> => {
    keyword.value = "";
    await loadNotes();
  };

  const openNoteById = async (id: string): Promise<void> => {
    const note = await findNoteById(id);

    if (!note) return;

    activeFolderKey.value = note.folder_id ?? ROOT_FOLDER_KEY;
    newNoteFolderId.value = note.folder_id;
    keyword.value = "";
    await loadNotes();

    if (!notes.value.some((item) => item.id === note.id)) {
      notes.value = [note, ...notes.value];
    }

    selectNote(note);
  };

  const formatNoteTime = (time: number): string => {
    const date = new Date(time || getCurrentTime());

    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  onMounted(async () => {
    await Promise.all([loadFolders(), loadNotes()]);

    unlistenOpenNote = await listen<OpenNotePayload>("open-note", async (event) => {
      const noteId = event.payload?.id;

      if (!noteId) return;

      await openNoteById(noteId);
    });
  });

  onBeforeUnmount(() => {
    if (statusTimer) {
      window.clearTimeout(statusTimer);
    }

    unlistenOpenNote?.();
  });

  return {
    activeFolderKey,
    activeNoteId,
    clearSearch,
    createNewNote,
    deleteCurrentNote,
    draft,
    folderTreeNodes,
    formatNoteTime,
    getNoteDescription,
    keyword,
    loadFolders,
    loadingNotes,
    moveCurrentNoteToFolder,
    newNoteFolderId,
    newNoteFolderTreeNodes,
    noteCountText,
    notes,
    saveCurrentNote,
    saving,
    searchCurrentNotes,
    selectFolder,
    selectNewNoteFolder,
    selectNote,
    selectedNote,
    statusMessage,
  };
};
