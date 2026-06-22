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
  type NoteQuery,
} from "@/request/apis/notes";
import { sleep } from "@/utils/sleep";
import { useMessageStore } from "./message";
import { useFolderStore } from "./folder";

const NOTE_PAGE_SIZE = 50;
const DEFAULT_NOTE_TITLE = "未命名笔记";
const EMPTY_NOTE_GUIDE_TITLE = "还没有笔记，点击右上角「新建笔记」开始记录";
const EMPTY_SELECTED_NOTE_TITLE = "选择或新建一条笔记";

type MarkdownEditorMode = "edit" | "preview";
type NoteEditorState = MarkdownEditorMode | "readonly";
type NoteMetaModalMode = "create" | "edit";

interface DraftSnapshot {
  title: string;
  describe: string;
  content: string;
  readonly: boolean;
  folderId: string | null;
}

interface NoteMetaDraft {
  title: string;
  describe: string;
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
  const messageStore = useMessageStore();
  const notes = ref<Note[]>([]);
  const activeNoteId = ref<string | null>(null);
  const loadingNotes = ref(false);
  const saving = ref(false);
  const markdownEditorMode = ref<MarkdownEditorMode>("preview");
  const savedDraftSnapshot = ref<DraftSnapshot>(createDraftSnapshot(null));
  const noteMetaModalVisible = ref(false);
  const noteMetaModalMode = ref<NoteMetaModalMode>("create");
  const editingMetaNoteId = ref<string | null>(null);

  const draft = reactive<DraftSnapshot>({
    title: "",
    describe: "",
    content: "",
    readonly: false,
    folderId: null,
  });

  const noteMetaDraft = reactive<NoteMetaDraft>({
    title: "",
    describe: "",
  });

  const selectedNote = computed(() => notes.value.find((note) => note.id === activeNoteId.value) ?? null);
  const noteCountText = computed(() => `${notes.value.length} 条笔记`);
  const hasDraftChanged = computed(() => !isSameDraftSnapshot(draft, savedDraftSnapshot.value));
  const noteEditorState = computed<NoteEditorState>(() => (draft.readonly ? "readonly" : markdownEditorMode.value));
  const noteEditorStateLabel = computed(() => NOTE_EDITOR_STATE_LABELS[noteEditorState.value]);
  const noteMetaModalTitle = computed(() => (noteMetaModalMode.value === "create" ? "新建笔记" : "编辑笔记信息"));
  const isNoteMetaConfirmDisabled = computed(() => !noteMetaDraft.title.trim() || saving.value);
  const windowTitle = computed(() => {
    if (!selectedNote.value) {
      return notes.value.length ? EMPTY_SELECTED_NOTE_TITLE : EMPTY_NOTE_GUIDE_TITLE;
    }

    return `${selectedNote.value.title || DEFAULT_NOTE_TITLE} · ${noteEditorStateLabel.value}`;
  });

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

  const createNoteQuery = (): NoteQuery => {
    const activeFolderId = folderStore.activeFolderId;

    if (!activeFolderId) {
      return {
        page: 1,
        page_size: NOTE_PAGE_SIZE,
      };
    }

    return {
      folder_id: activeFolderId,
      root_only: false,
      page: 1,
      page_size: NOTE_PAGE_SIZE,
    };
  };

  const loadNotes = async (): Promise<void> => {
    loadingNotes.value = true;

    try {
      const result = await listNotes(createNoteQuery());
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

  const openCreateNoteModal = (): void => {
    noteMetaModalMode.value = "create";
    editingMetaNoteId.value = null;
    noteMetaDraft.title = "";
    noteMetaDraft.describe = "";
    noteMetaModalVisible.value = true;
  };

  const openEditNoteMetaModal = (note: Note): void => {
    noteMetaModalMode.value = "edit";
    editingMetaNoteId.value = note.id;
    noteMetaDraft.title = note.title;
    noteMetaDraft.describe = note.describe ?? "";
    noteMetaModalVisible.value = true;
  };

  const closeNoteMetaModal = (): void => {
    noteMetaModalVisible.value = false;
  };

  const submitNoteMetaModal = async (): Promise<void> => {
    const title = noteMetaDraft.title.trim();

    if (!title) return;

    if (noteMetaModalMode.value === "create") {
      await createNewNote(title, noteMetaDraft.describe.trim() || null);
      return;
    }

    await updateNoteMeta(title, noteMetaDraft.describe.trim() || null);
  };

  const createNewNote = async (title: string, describe: string | null): Promise<void> => {
    saving.value = true;

    try {
      const note = await createNote({
        title,
        describe,
        content: "",
        readonly: false,
        folder_id: folderStore.activeFolderId,
      });
      await sleep();

      notes.value = [note, ...notes.value];
      selectNote(note);
      markdownEditorMode.value = "edit";
      closeNoteMetaModal();
      messageStore.success("已新建笔记");
    } finally {
      saving.value = false;
    }
  };

  const updateNoteMeta = async (title: string, describe: string | null): Promise<void> => {
    const note = notes.value.find((item) => item.id === editingMetaNoteId.value);

    if (!note) return;

    saving.value = true;

    try {
      const currentDraft = note.id === activeNoteId.value ? draft : createDraftSnapshot(note);
      const updatedNote = await updateNote({
        id: note.id,
        title,
        describe,
        content: currentDraft.content,
        readonly: currentDraft.readonly,
        folder_id: currentDraft.folderId,
      });
      await sleep();

      notes.value = notes.value.map((item) => (item.id === updatedNote.id ? updatedNote : item));

      if (updatedNote.id === activeNoteId.value) {
        selectNote(updatedNote);
      }

      closeNoteMetaModal();
      messageStore.success("已更新笔记信息");
    } finally {
      saving.value = false;
    }
  };

  const saveCurrentNote = async (): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote) return;

    if (!hasDraftChanged.value) {
      markdownEditorMode.value = "preview";
      return;
    }

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
      await sleep();

      notes.value = notes.value.map((note) => (note.id === updatedNote.id ? updatedNote : note));
      selectNote(updatedNote);
      markdownEditorMode.value = "preview";
      messageStore.success("已保存");
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
      await sleep();

      notes.value = notes.value.map((note) => (note.id === updatedNote.id ? updatedNote : note));
      selectNote(updatedNote);
      markdownEditorMode.value = "preview";
      messageStore.success(nextReadonly ? "已设为只读" : "已取消只读");
    } finally {
      saving.value = false;
    }
  };

  const deleteCurrentNote = async (): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote) return;

    await deleteNote(currentNote.id);
    await sleep();
    notes.value = notes.value.filter((note) => note.id !== currentNote.id);
    activeNoteId.value = notes.value[0]?.id ?? null;
    syncDraft(selectedNote.value);
    messageStore.success("已删除笔记");
  };

  const moveCurrentNoteToFolder = async (folderId: string | null): Promise<void> => {
    const currentNote = selectedNote.value;

    if (!currentNote) return;

    const updatedNote = await moveNoteToFolder(currentNote.id, folderId);
    await sleep();
    notes.value = notes.value.map((note) => (note.id === updatedNote.id ? updatedNote : note));
    selectNote(updatedNote);
    messageStore.success("已移动笔记");
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
    closeNoteMetaModal,
    deleteCurrentNote,
    draft,
    formatNoteTime,
    getNoteDescription,
    hasDraftChanged,
    isNoteMetaConfirmDisabled,
    loadNotes,
    loadingNotes,
    markdownEditorMode,
    moveCurrentNoteToFolder,
    noteCountText,
    noteEditorState,
    noteEditorStateLabel,
    noteMetaDraft,
    noteMetaModalMode,
    noteMetaModalTitle,
    noteMetaModalVisible,
    notes,
    openCreateNoteModal,
    openEditNoteMetaModal,
    openNoteById,
    resetActiveNote,
    saveCurrentNote,
    saving,
    selectNote,
    selectedNote,
    submitNoteMetaModal,
    toggleCurrentNoteReadonly,
    windowTitle,
  };
});
