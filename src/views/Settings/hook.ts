import { computed, onMounted, ref } from "vue";
import {
  closeSettingsWindow,
  getConfig,
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

const DEFAULT_FOLDER_NAME = "新建分类";

type ShortcutField = "toggle_shortcut" | "search_shortcut";

const CONTROL_KEYS = new Set([
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

  if (!CONTROL_KEYS.has(event.key)) {
    keys.push(formatShortcutKey(event.key));
  }

  return keys.join("+");
};

export const useHSettings = () => {
  const config = ref<AppConfig>();
  const folders = ref<FolderTreeNode[]>([]);
  const activeDrawer = ref("theme");
  const saving = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");
  const listeningShortcutField = ref<ShortcutField | null>(null);
  const folderName = ref(DEFAULT_FOLDER_NAME);
  const folderParentId = ref<string | null>(null);

  const flatFolders = computed(() => flattenFolderTree(folders.value));

  const loadConfig = async (): Promise<void> => {
    config.value = await getConfig();
  };

  const loadFolders = async (): Promise<void> => {
    folders.value = await listFolderTree();
  };

  const clearMessage = (): void => {
    errorMessage.value = "";
    successMessage.value = "";
  };

  const saveConfig = async (): Promise<void> => {
    if (!config.value) return;

    saving.value = true;
    clearMessage();

    try {
      config.value = await updateConfig(config.value);
      successMessage.value = "保存成功";
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : String(error);
    } finally {
      saving.value = false;
    }
  };

  const startListenShortcut = (field: ShortcutField): void => {
    listeningShortcutField.value = field;
    clearMessage();
  };

  const stopListenShortcut = (): void => {
    listeningShortcutField.value = null;
  };

  const captureShortcut = (event: KeyboardEvent): void => {
    if (!config.value || !listeningShortcutField.value) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Escape") {
      stopListenShortcut();
      return;
    }

    const shortcut = getShortcutFromKeyboardEvent(event);

    if (!shortcut || shortcut === "CommandOrControl" || shortcut === "Shift" || shortcut === "Alt") {
      return;
    }

    config.value[listeningShortcutField.value] = shortcut;
    stopListenShortcut();
  };

  const createRootFolder = async (): Promise<void> => {
    const name = folderName.value.trim();

    if (!name) return;

    await createFolder({
      parent_id: folderParentId.value,
      name,
      sort_order: getNextSortOrder(folders.value),
    });

    folderName.value = DEFAULT_FOLDER_NAME;
    folderParentId.value = null;
    await loadFolders();
  };

  const removeFolder = async (id: string): Promise<void> => {
    await deleteFolder(id);
    await loadFolders();
  };

  const closeWindow = async (): Promise<void> => {
    await closeSettingsWindow();
  };

  const startDragWindow = async (): Promise<void> => {
    await startDraggingSettingsWindow();
  };

  onMounted(async () => {
    await Promise.all([loadConfig(), loadFolders()]);
  });

  return {
    activeDrawer,
    captureShortcut,
    closeWindow,
    config,
    createRootFolder,
    errorMessage,
    flatFolders,
    folderName,
    folderParentId,
    folders,
    listeningShortcutField,
    loadFolders,
    removeFolder,
    saveConfig,
    saving,
    startDragWindow,
    startListenShortcut,
    stopListenShortcut,
    successMessage,
  };
};
