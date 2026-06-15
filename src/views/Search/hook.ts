import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { nextTick, onMounted, ref, watch } from "vue";

interface Note {
  id: string;
  title: string;
  describe?: string | null;
  content?: string | null;
  readonly: boolean;
  created_at: number;
  updated_at: number;
  deleted: boolean;
}

interface PageResult<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

const SEARCH_PAGE_SIZE = 6;

export const useHSearch = () => {
  const inputRef = ref<HTMLInputElement>();
  const keyword = ref("");
  const suggestions = ref<Note[]>([]);
  const activeIndex = ref(0);

  let searchTimer: number | undefined;

  const closeSearch = async (): Promise<void> => {
    await invoke("close_search_window");
  };

  const searchNotes = async (): Promise<void> => {
    const trimmedKeyword = keyword.value.trim();

    if (!trimmedKeyword) {
      suggestions.value = [];
      activeIndex.value = 0;
      return;
    }

    const result = await invoke<PageResult<Note>>("search_notes", {
      query: {
        keyword: trimmedKeyword,
        page: 1,
        page_size: SEARCH_PAGE_SIZE,
      },
    });

    suggestions.value = result.items;
    activeIndex.value = 0;
  };

  const moveActiveSuggestion = (step: number): void => {
    if (!suggestions.value.length) {
      return;
    }

    activeIndex.value =
      (activeIndex.value + step + suggestions.value.length) % suggestions.value.length;
  };

  const selectSuggestion = async (suggestion: Note): Promise<void> => {
    await invoke("show_main_window");
    await emit("open-note", { id: suggestion.id });
    await closeSearch();
  };

  const selectActiveSuggestion = async (): Promise<void> => {
    const suggestion = suggestions.value[activeIndex.value];

    if (!suggestion) {
      return;
    }

    await selectSuggestion(suggestion);
  };

  watch(keyword, () => {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
    }

    searchTimer = window.setTimeout(() => {
      searchNotes();
    }, 160);
  });

  onMounted(async () => {
    await nextTick();
    inputRef.value?.focus();
  });

  return {
    activeIndex,
    closeSearch,
    inputRef,
    keyword,
    moveActiveSuggestion,
    selectActiveSuggestion,
    selectSuggestion,
    suggestions,
  };
};
