import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
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
const DEFAULT_NOTE_TITLE = "未命名笔记";
const FOLDER_TREE_ICON = "lucide:folder";

type NoteEditorState = "empty" | "clean" | "dirty" | "saving" | "saved" | "readonly";
type MarkdownEditorMode = "edit" | "preview";

interface DraftSnapshot {
  title: string;
  describe: string;
  content: string;
  readonly: boolean;
  folderId: string | null;
}

const NOTE_EDITOR_STATE_LABELS: Record<NoteEditorState, string> = {
  empty: "未选择",
  clean: "已同步",
  dirty: "未保存",
  saving: "保存中",
  saved: "已保存",
  readonly: "只读",
};

const mapFolderToTreeNode = (folder: FolderTreeNode): HTreeNode => ({
  id: folder.id,
  label: folder.name,
  icon: FOLDER_TREE_ICON,
  raw: folder,
  children: folder.children.map(mapFolderToTreeNode),
});

const getCurrentTime = (): number => Date.now();

const createDraftSnapshot = (note: Note | null): DraftSnapshot => ({
  title: note?.title ?? "",
  describe: note?.describe ?? "",
  content: note?.content ?? "",
  readonly: note?.readonly ?? false,
  folderId: note?.folder_id ?? null,
});

const isSameDraftSnapshot = (draft: DraftSnapshot, snapshot: DraftSnapshot): boolean =>
  draft.title === snapshot.title &&
  draft.describe === snapshot.describe &&
  draft.content === snapshot.content &&
  draft.readonly === snapshot.readonly &&
  draft.folderId === snapshot.folderId;

const normalizeDraftTitle = (title: string): string => {
  const trimmedTitle = title.trim();

  return trimmedTitle || DEFAULT_NOTE_TITLE;
};

export const useSystemStore = defineStore("system", () => {
  const appVersion = ref(__APP_VERSION__);
  const folders = ref<FolderTreeNode[]>([]);
  const notes = ref<Note[]>([]);
  const activeFolderId = ref<string | null>(null);
  const activeNoteId = ref<string | null>(null);
  const loadingNotes = ref(false);
  const saving = ref(false);
  const keyword = ref("");
  const statusMessage = ref("");
  const noteEditorState = ref<NoteEditorState>("empty");
  const markdownEditorMode = ref<MarkdownEditorMode>("preview");
  const savedDraftSnapshot = ref<DraftSnapshot>(createDraftSnapshot(null));

  const draft = reactive<DraftSnapshot>({
    title: "",
    describe: "",
    content: "",
    readonly: false,
    folderId: null,
  });

  let statusTimer: number | undefined;

  const appVersionText = computed(() => `v${appVersion.value}`);
  const folderTreeNodes = computed<HTreeNode[]>(() => folders.value.map(mapFolderToTreeNode));
  const selectedNote = computed(() => notes.value.find((note) => note.id === activeNoteId.value) ?? null);
  const noteCountText = computed(() => `${notes.value.length} 条笔记`);
  const hasDraftChanged = computed(() => !isSameDraftSnapshot(draft, savedDraftSnapshot.value));
  const noteEditorStateLabel = computed(() => NOTE_EDITOR_STATE_LABELS[noteEditorState.value]);
  const windowTitle = computed(() => {
    const title = selectedNote.value?.title || draft.title || DEFAULT_NOTE_TITLE;

    return `${title} · ${noteEditorStateLabel.value}`;
  });

  const getNoteDescription = (note: Note): string => {
    if (note.describe?.trim()) return note.describe;
    if (note.content?.trim()) return note.content;

    return "暂无内容";
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

  const transitionNoteEditorState = (): void => {
    if (!selectedNote.value) {
      noteEditorState.value = "empty";
      return;
    }

    if (saving.value) {
      noteEditorState.value = "saving";
      return;
    }

    if (draft.readonly) {
      noteEditorState.value = "readonly";
      return;
    }

    noteEditorState.value = hasDraftChanged.value ? "dirty" : "clean";
  };

  const syncDraft = (note: Note | null): void => {
    const snapshot = createDraftSnapshot(note);

    draft.title = snapshot.title;
    draft.describe = snapshot.describe;
    draft.content = snapshot.content;
    draft.readonly = snapshot.readonly;
    draft.folderId = snapshot.folderId;
    savedDraftSnapshot.value = snapshot;
    markdownEditorMode.value = "preview";
    transitionNoteEditorState();
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
            folder_id: activeFolderId.value,
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

  const initializeSystemData = async (): Promise<void> => {
    await Promise.all([loadFolders(), loadNotes()]);
  };

  const selectFolder = async (node: HTreeNode | null): Promise<void> => {
    activeFolderId.value = node?.id ?? null;
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
      folder_id: null,
    });

    activeFolderId.value = null;
    notes.value = [note, ...notes.value];
    selectNote(note);
    markdownEditorMode.value = "edit";
    noteEditorState.value = "saved";
    showStatusMessage("已新建笔记");
  };

  const saveCurrentNote = async (): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote || !hasDraftChanged.value) return;

    saving.value = true;
    transitionNoteEditorState();

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
      markdownEditorMode.value = "preview";
      noteEditorState.value = "saved";
      showStatusMessage("已保存");
    } finally {
      saving.value = false;
      if (noteEditorState.value !== "saved") {
        transitionNoteEditorState();
      }
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

    activeFolderId.value = note.folder_id;
    keyword.value = "";
    await loadNotes();

    if (!notes.value.some((item) => item.id === note.id)) {
      notes.value = [note, ...notes.value];
    }

    selectNote(note);
  };

  watch(
    () => [draft.title, draft.describe, draft.content, draft.readonly, draft.folderId] as const,
    transitionNoteEditorState,
  );

  return {
    activeFolderId,
    activeNoteId,
    appVersion,
    appVersionText,
    clearSearch,
    createNewNote,
    deleteCurrentNote,
    draft,
    folderTreeNodes,
    formatNoteTime,
    getNoteDescription,
    hasDraftChanged,
    initializeSystemData,
    keyword,
    loadFolders,
    loadNotes,
    loadingNotes,
    markdownEditorMode,
    moveCurrentNoteToFolder,
    noteCountText,
    noteEditorState,
    noteEditorStateLabel,
    notes,
    openNoteById,
    saveCurrentNote,
    saving,
    searchCurrentNotes,
    selectFolder,
    selectNote,
    selectedNote,
    statusMessage,
    windowTitle,
  };
});
