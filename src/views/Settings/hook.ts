import { computed, onMounted, ref, watch } from "vue";
import {
  closeSettingsWindow,
  getConfig,
  resetConfig,
  startDraggingSettingsWindow,
  updateConfig,
  type AppConfig,
} from "@/request/apis/config";
import {
  createFolder,
  deleteFolder,
  listFolderTree,
  type FolderTreeNode,
} from "@/request/apis/notes";
import {
  MESSAGE_VISIBLE_DURATION,
  SETTINGS_ERROR_MESSAGE_RULES,
  SETTINGS_MESSAGES,
} from "@/constants/message";
import {
  APP_THEME_OPTIONS,
  DEFAULT_APP_THEME,
  applyTheme,
  isAppTheme,
  type AppTheme,
} from "@/services/theme";

const DEFAULT_FOLDER_NAME = "新建分类";

type ShortcutField = "toggle_shortcut" | "search_shortcut";

const MODIFIER_KEYS = new Set([
  "Control",
  "Shift",
  "Alt",
  "Meta",
  "OS",
]);

const KEY_NAME_MAP: Record<string, string> = {
  " ": "Space",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  Escape: "Esc",
};

const normalizeErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error || "");
  const matchedRule = SETTINGS_ERROR_MESSAGE_RULES.find((rule) => message.includes(rule.keyword));

  if (matchedRule) return matchedRule.message;
  if (!message) return SETTINGS_MESSAGES.error.default;

  return `${SETTINGS_MESSAGES.error.default}：${message}`;
};

const getNextSortOrder = (folders: FolderTreeNode[]): number => {
  if (!folders.length) return 0;

  return Math.max(...folders.map((folder) => folder.sort_order)) + 1;
};

const flattenFolderTree = (folders: FolderTreeNode[], level = 0): Array<FolderTreeNode & { level: number }> =>
  folders.flatMap((folder) => [
    { ...folder, level },
    ...flattenFolderTree(folder.children, level + 1),
  ]);

const formatShortcutKey = (key: string): string => {
  if (KEY_NAME_MAP[key]) return KEY_NAME_MAP[key];
  if (key.length === 1) return key.toUpperCase();

  return key;
};

const getShortcutFromKeyboardEvent = (event: KeyboardEvent): string => {
  const keys: string[] = [];

  if (event.ctrlKey || event.metaKey) keys.push("CommandOrControl");
  if (event.shiftKey) keys.push("Shift");
  if (event.altKey) keys.push("Alt");

  keys.push(formatShortcutKey(event.key));

  return keys.join("+");
};

export const useHSettings = () => {
  const config = ref<AppConfig>();
  const folders = ref<FolderTreeNode[]>([]);
  const activeDrawer = ref("theme");
  const saving = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");
  const themeDraft = ref<AppTheme>(DEFAULT_APP_THEME);
  const listeningShortcutField = ref<ShortcutField | null>(null);
  const folderName = ref(DEFAULT_FOLDER_NAME);
  const folderParentId = ref<string | null>(null);

  let messageTimer: number | undefined;

  const flatFolders = computed(() => flattenFolderTree(folders.value));

  const syncThemeDraft = (): void => {
    if (!config.value) return;

    themeDraft.value = isAppTheme(config.value.theme) ? config.value.theme : DEFAULT_APP_THEME;
  };

  const loadConfig = async (): Promise<void> => {
    config.value = await getConfig();
    syncThemeDraft();
    applyTheme(config.value.theme);
  };

  const loadFolders = async (): Promise<void> => {
    folders.value = await listFolderTree();
  };

  const clearMessage = (): void => {
    if (messageTimer) {
      window.clearTimeout(messageTimer);
      messageTimer = undefined;
    }

    errorMessage.value = "";
    successMessage.value = "";
  };

  const showSuccessMessage = (message: string): void => {
    clearMessage();
    successMessage.value = message;

    messageTimer = window.setTimeout(clearMessage, MESSAGE_VISIBLE_DURATION);
  };

  const showErrorMessage = (error: unknown): void => {
    clearMessage();
    errorMessage.value = normalizeErrorMessage(error);

    messageTimer = window.setTimeout(clearMessage, MESSAGE_VISIBLE_DURATION);
  };

  const resetPageState = (): void => {
    clearMessage();
    stopListenShortcut();
    syncThemeDraft();
    folderName.value = DEFAULT_FOLDER_NAME;
    folderParentId.value = null;
  };

  const saveConfig = async (): Promise<void> => {
    if (!config.value) return;

    saving.value = true;
    clearMessage();

    try {
      config.value = await updateConfig(config.value);
      syncThemeDraft();
      applyTheme(config.value.theme);
      showSuccessMessage(SETTINGS_MESSAGES.success.saved);
    } catch (error) {
      showErrorMessage(error);
    } finally {
      saving.value = false;
    }
  };

  const confirmTheme = async (): Promise<void> => {
    if (!config.value) return;

    config.value.theme = themeDraft.value;
    await saveConfig();
  };

  const saveStartupSettings = async (): Promise<void> => {
    await saveConfig();
  };

  const resetSettings = async (): Promise<void> => {
    saving.value = true;
    resetPageState();

    try {
      config.value = await resetConfig();
      syncThemeDraft();
      applyTheme(config.value.theme);
      showSuccessMessage(SETTINGS_MESSAGES.success.reset);
    } catch (error) {
      showErrorMessage(error);
    } finally {
      saving.value = false;
    }
  };

  const startListenShortcut = (field: ShortcutField): void => {
    listeningShortcutField.value = field;
    clearMessage();
  };

  function stopListenShortcut(): void {
    listeningShortcutField.value = null;
  }

  const captureShortcut = (event: KeyboardEvent): void => {
    if (!config.value || !listeningShortcutField.value) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Escape") {
      stopListenShortcut();
      return;
    }

    if (MODIFIER_KEYS.has(event.key)) {
      return;
    }

    const shortcut = getShortcutFromKeyboardEvent(event);

    if (!shortcut) {
      return;
    }

    config.value[listeningShortcutField.value] = shortcut;
    stopListenShortcut();
  };

  const createRootFolder = async (): Promise<void> => {
    const name = folderName.value.trim();

    if (!name) return;

    try {
      await createFolder({
        parent_id: folderParentId.value,
        name,
        sort_order: getNextSortOrder(folders.value),
      });

      folderName.value = DEFAULT_FOLDER_NAME;
      folderParentId.value = null;
      await loadFolders();
      showSuccessMessage(SETTINGS_MESSAGES.success.folderCreated);
    } catch (error) {
      showErrorMessage(error);
    }
  };

  const removeFolder = async (id: string): Promise<void> => {
    try {
      await deleteFolder(id);
      await loadFolders();
      showSuccessMessage(SETTINGS_MESSAGES.success.folderDeleted);
    } catch (error) {
      showErrorMessage(error);
    }
  };

  const closeWindow = async (): Promise<void> => {
    await closeSettingsWindow();
  };

  const startDragWindow = async (): Promise<void> => {
    await startDraggingSettingsWindow();
  };

  watch(activeDrawer, resetPageState);

  onMounted(async () => {
    await Promise.all([loadConfig(), loadFolders()]);
  });

  return {
    activeDrawer,
    captureShortcut,
    closeWindow,
    config,
    confirmTheme,
    createRootFolder,
    errorMessage,
    flatFolders,
    folderName,
    folderParentId,
    folders,
    listeningShortcutField,
    loadFolders,
    removeFolder,
    resetSettings,
    saveConfig,
    saveStartupSettings,
    saving,
    startDragWindow,
    startListenShortcut,
    stopListenShortcut,
    successMessage,
    themeDraft,
    themeOptions: APP_THEME_OPTIONS,
  };
};
