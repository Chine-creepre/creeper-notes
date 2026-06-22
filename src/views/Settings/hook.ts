import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import {
  closeSettingsWindow,
  getConfig,
  resetConfig,
  startDraggingSettingsWindow,
  updateConfig,
  type AppConfig,
} from "@/request/apis/config";
import type { FolderTreeNode } from "@/request/apis/notes";
import type { HTreeNode } from "@/components/Tree/types";
import {
  MESSAGE_VISIBLE_DURATION,
  SETTINGS_ERROR_MESSAGE_RULES,
  SETTINGS_MESSAGES,
} from "@/constants/message";
import {
  APP_THEME_OPTIONS,
  DEFAULT_APP_THEME,
  applyAppConfig,
  isAppTheme,
  type AppTheme,
} from "@/services/theme";
import { useFolderStore } from "@/stores/modules/folder";

const DEFAULT_FOLDER_NAME = "新建分类";
const FOLDER_TREE_ICON = "lucide:folder";
const APP_VERSION_TEXT = `v${__APP_VERSION__}`;

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

const flattenFolders = (folders: FolderTreeNode[]): FolderTreeNode[] =>
  folders.flatMap((folder) => [folder, ...flattenFolders(folder.children)]);

const getFolderFromTreeNode = (node: HTreeNode): FolderTreeNode | null => {
  const folder = node.raw as FolderTreeNode | undefined;

  return folder ?? null;
};

const mapFolderToTreeNode = (folder: FolderTreeNode): HTreeNode => ({
  id: folder.id,
  label: folder.name,
  icon: FOLDER_TREE_ICON,
  editable: true,
  deletable: true,
  raw: folder,
  children: folder.children.map(mapFolderToTreeNode),
});

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
  const folderStore = useFolderStore();
  const { folders } = storeToRefs(folderStore);
  const appVersionText = ref(APP_VERSION_TEXT);
  const config = ref<AppConfig>();
  const activeDrawer = ref("theme");
  const saving = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");
  const themeDraft = ref<AppTheme>(DEFAULT_APP_THEME);
  const listeningShortcutField = ref<ShortcutField | null>(null);
  const folderName = ref(DEFAULT_FOLDER_NAME);
  const folderParentId = ref<string | null>(null);
  const editingFolderId = ref<string | null>(null);
  const editingFolderName = ref("");
  const editingFolderParentId = ref<string | null>(null);

  let messageTimer: number | undefined;

  const folderTreeNodes = computed(() => folders.value.map(mapFolderToTreeNode));
  const isEditingFolder = computed(() => Boolean(editingFolderId.value));

  const syncThemeDraft = (): void => {
    if (!config.value) return;

    themeDraft.value = isAppTheme(config.value.theme) ? config.value.theme : DEFAULT_APP_THEME;
  };

  const loadConfig = async (): Promise<void> => {
    config.value = await getConfig();
    syncThemeDraft();
    applyAppConfig(config.value);
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

  const resetFolderEditState = (): void => {
    editingFolderId.value = null;
    editingFolderName.value = "";
    editingFolderParentId.value = null;
  };

  const resetPageState = (): void => {
    clearMessage();
    stopListenShortcut();
    syncThemeDraft();
    folderName.value = DEFAULT_FOLDER_NAME;
    folderParentId.value = null;
    resetFolderEditState();
  };

  const saveConfig = async (): Promise<void> => {
    if (!config.value) return;

    saving.value = true;
    clearMessage();

    try {
      config.value = await updateConfig(config.value);
      syncThemeDraft();
      applyAppConfig(config.value);
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
      applyAppConfig(config.value);
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
      await folderStore.createFolderItem({
        parent_id: folderParentId.value,
        name,
        sort_order: getNextSortOrder(folders.value),
      });

      folderName.value = DEFAULT_FOLDER_NAME;
      folderParentId.value = null;
      showSuccessMessage(SETTINGS_MESSAGES.success.folderCreated);
    } catch (error) {
      showErrorMessage(error);
    }
  };

  const startEditFolder = (node: HTreeNode): void => {
    const folder = getFolderFromTreeNode(node);

    if (!folder) return;

    clearMessage();
    editingFolderId.value = folder.id;
    editingFolderName.value = folder.name;
    editingFolderParentId.value = folder.parent_id;
  };

  const cancelEditFolder = (): void => {
    resetFolderEditState();
  };

  const saveEditFolder = async (): Promise<void> => {
    const name = editingFolderName.value.trim();

    if (!editingFolderId.value || !name) return;

    const folder = flattenFolders(folders.value).find((item) => item.id === editingFolderId.value);

    if (!folder) return;

    try {
      await folderStore.updateFolderItem({
        id: editingFolderId.value,
        parent_id: editingFolderParentId.value,
        name,
        sort_order: folder.sort_order,
      });

      resetFolderEditState();
      showSuccessMessage(SETTINGS_MESSAGES.success.folderUpdated);
    } catch (error) {
      showErrorMessage(error);
    }
  };

  const removeFolderByNode = async (node: HTreeNode): Promise<void> => {
    const folder = getFolderFromTreeNode(node);

    if (!folder) return;

    await removeFolder(folder.id);
  };

  const removeFolder = async (id: string): Promise<void> => {
    try {
      await folderStore.deleteFolderItem(id);
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
    await Promise.all([loadConfig(), folderStore.loadFolders()]);
  });

  return {
    activeDrawer,
    appVersionText,
    cancelEditFolder,
    captureShortcut,
    closeWindow,
    config,
    confirmTheme,
    createRootFolder,
    editingFolderId,
    editingFolderName,
    editingFolderParentId,
    errorMessage,
    folderName,
    folderParentId,
    folderTreeNodes,
    folders,
    isEditingFolder,
    listeningShortcutField,
    loadFolders: folderStore.loadFolders,
    removeFolder,
    removeFolderByNode,
    resetSettings,
    saveConfig,
    saveEditFolder,
    saveStartupSettings,
    saving,
    startDragWindow,
    startEditFolder,
    startListenShortcut,
    stopListenShortcut,
    successMessage,
    themeDraft,
    themeOptions: APP_THEME_OPTIONS,
  };
};
