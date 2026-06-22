import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import {
  createNote,
  deleteNote,
  findNoteById,
  listNotes,
  moveNoteToFolder,
  updateNote,
  type Note,
} from "@/request/apis/notes";
import { useFolderStore } from "./folder";

const NOTE_PAGE_SIZE = 50;
const DEFAULT_NOTE_TITLE = "未命名笔记";

type MarkdownEditorMode = "edit" | "preview";
type NoteEditorState = MarkdownEditorMode | "readonly";

interface DraftSnapshot {
  title: string;
  describe: string;
  content: string;
  readonly: boolean;
  folderId: string | null;
}

const NOTE_EDITOR_STATE_LABELS: Record<NoteEditorState, string> = {
  edit: "编辑中",
  preview: "预览中",
  readonly: "只读",
};

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

export const useNoteStore = defineStore("note", () => {
  const folderStore = useFolderStore();
  const notes = ref<Note[]>([]);
  const activeNoteId = ref<string | null>(null);
  const loadingNotes = ref(false);
  const saving = ref(false);
  const statusMessage = ref("");
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

  const selectedNote = computed(() => notes.value.find((note) => note.id === activeNoteId.value) ?? null);
  const noteCountText = computed(() => `${notes.value.length} 条笔记`);
  const hasDraftChanged = computed(() => !isSameDraftSnapshot(draft, savedDraftSnapshot.value));
  const noteEditorState = computed<NoteEditorState>(() => (draft.readonly ? "readonly" : markdownEditorMode.value));
  const noteEditorStateLabel = computed(() => NOTE_EDITOR_STATE_LABELS[noteEditorState.value]);
  const windowTitle = computed(() => {
    const title = selectedNote.value?.title || draft.title || DEFAULT_NOTE_TITLE;

    return `${title} · ${noteEditorStateLabel.value}`;
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
    const snapshot = createDraftSnapshot(note);

    draft.title = snapshot.title;
    draft.describe = snapshot.describe;
    draft.content = snapshot.content;
    draft.readonly = snapshot.readonly;
    draft.folderId = snapshot.folderId;
    savedDraftSnapshot.value = snapshot;
    markdownEditorMode.value = "preview";
  };

  const loadNotes = async (): Promise<void> => {
    loadingNotes.value = true;

    try {
      const activeFolderId = folderStore.activeFolderId;
      const result = await listNotes({
        folder_id: activeFolderId,
        root_only: activeFolderId === null,
        page: 1,
        page_size: NOTE_PAGE_SIZE,
      });
      notes.value = result.items;

      if (!notes.value.some((note) => note.id === activeNoteId.value)) {
        activeNoteId.value = notes.value[0]?.id ?? null;
      }

      syncDraft(selectedNote.value);
    } finally {
      loadingNotes.value = false;
    }
  };

  const selectNote = (note: Note): void => {
    activeNoteId.value = note.id;
    syncDraft(note);
  };

  const resetActiveNote = (): void => {
    activeNoteId.value = null;
  };

  const createNewNote = async (): Promise<void> => {
    const note = await createNote({
      title: DEFAULT_NOTE_TITLE,
      describe: null,
      content: "",
      readonly: false,
      folder_id: folderStore.activeFolderId,
    });

    notes.value = [note, ...notes.value];
    selectNote(note);
    markdownEditorMode.value = "edit";
    showStatusMessage("已新建笔记");
  };

  const saveCurrentNote = async (): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote || !hasDraftChanged.value) return;

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
      markdownEditorMode.value = "preview";
      showStatusMessage("已保存");
    } finally {
      saving.value = false;
    }
  };

  const toggleCurrentNoteReadonly = async (): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote) return;

    const nextReadonly = !draft.readonly;
    saving.value = true;

    try {
      const updatedNote = await updateNote({
        id: currentNote.id,
        title: normalizeDraftTitle(draft.title),
        describe: draft.describe.trim() || null,
        content: draft.content,
        readonly: nextReadonly,
        folder_id: draft.folderId,
      });

      notes.value = notes.value.map((note) => (note.id === updatedNote.id ? updatedNote : note));
      selectNote(updatedNote);
      markdownEditorMode.value = "preview";
      showStatusMessage(nextReadonly ? "已设为只读" : "已取消只读");
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

  const openNoteById = async (id: string): Promise<void> => {
    const note = await findNoteById(id);

    if (!note) return;

    folderStore.activeFolderId = note.folder_id;
    await loadNotes();

    if (!notes.value.some((item) => item.id === note.id)) {
      notes.value = [note, ...notes.value];
    }

    selectNote(note);
  };

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

  return {
    activeNoteId,
    createNewNote,
    deleteCurrentNote,
    draft,
    formatNoteTime,
    getNoteDescription,
    hasDraftChanged,
    loadNotes,
    loadingNotes,
    markdownEditorMode,
    moveCurrentNoteToFolder,
    noteCountText,
    noteEditorState,
    noteEditorStateLabel,
    notes,
    openNoteById,
    resetActiveNote,
    saveCurrentNote,
    saving,
    selectNote,
    selectedNote,
    statusMessage,
    toggleCurrentNoteReadonly,
    windowTitle,
  };
});
