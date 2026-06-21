import { invoke } from "@tauri-apps/api/core";
import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { searchNotes, type Note } from "@/request/apis/notes";

const SEARCH_PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_DELAY = 160;
const FOCUS_SEARCH_INPUT_EVENT = "focus-search-input";

export const useHSearch = () => {
  const inputRef = ref<HTMLInputElement>();
  const keyword = ref("");
  const suggestions = ref<Note[]>([]);
  const activeIndex = ref(0);
  const searching = ref(false);
  const searched = ref(false);

  let searchTimer: number | undefined;
  let unlistenFocusSearchInput: UnlistenFn | undefined;

  const trimmedKeyword = computed(() => keyword.value.trim());
  const hasKeyword = computed(() => Boolean(trimmedKeyword.value));
  const hasSuggestions = computed(() => suggestions.value.length > 0);
  const isEmptyResult = computed(
    () => hasKeyword.value && searched.value && !searching.value && !hasSuggestions.value,
  );

  const resizeSearchWindow = async (expanded: boolean): Promise<void> => {
    await invoke("resize_search_window", { expanded });
  };

  const focusInput = async (): Promise<void> => {
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  };

  const closeSearch = async (): Promise<void> => {
    await invoke("close_search_window");
  };

  const startDragWindow = async (): Promise<void> => {
    await invoke("start_dragging_search_window");
  };

  const fetchSuggestions = async (): Promise<void> => {
    if (!trimmedKeyword.value) {
      suggestions.value = [];
      activeIndex.value = 0;
      searched.value = false;
      await resizeSearchWindow(false);
      return;
    }

    await resizeSearchWindow(true);
    searching.value = true;

    try {
      const result = await searchNotes({
        keyword: trimmedKeyword.value,
        page: 1,
        page_size: SEARCH_PAGE_SIZE,
      });

      suggestions.value = result.items;
      activeIndex.value = 0;
      searched.value = true;
    } finally {
      searching.value = false;
    }
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
      fetchSuggestions();
    }, SEARCH_DEBOUNCE_DELAY);
  });

  onMounted(async () => {
    await resizeSearchWindow(false);
    await focusInput();

    unlistenFocusSearchInput = await listen(FOCUS_SEARCH_INPUT_EVENT, async () => {
      keyword.value = "";
      suggestions.value = [];
      activeIndex.value = 0;
      searched.value = false;
      await resizeSearchWindow(false);
      await focusInput();
    });
  });

  onBeforeUnmount(() => {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
    }

    unlistenFocusSearchInput?.();
  });

  return {
    activeIndex,
    closeSearch,
    hasKeyword,
    hasSuggestions,
    inputRef,
    isEmptyResult,
    keyword,
    moveActiveSuggestion,
    searching,
    selectActiveSuggestion,
    selectSuggestion,
    startDragWindow,
    suggestions,
    trimmedKeyword,
  };
};
