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

const getNextSortOrder = (folders: FolderTreeNode[]): number => {
  if (!folders.length) return 0;

  return Math.max(...folders.map((folder) => folder.sort_order)) + 1;
};

const flattenFolderTree = (folders: FolderTreeNode[], level = 0): Array<FolderTreeNode & { level: number }> =>
  folders.flatMap((folder) => [
    { ...folder, level },
    ...flattenFolderTree(folder.children, level + 1),
  ]);

export const useHSettings = () => {
  const config = ref<AppConfig>();
  const folders = ref<FolderTreeNode[]>([]);
  const activeDrawer = ref("theme");
  const saving = ref(false);
  const folderName = ref(DEFAULT_FOLDER_NAME);
  const folderParentId = ref<string | null>(null);

  const flatFolders = computed(() => flattenFolderTree(folders.value));

  const loadConfig = async (): Promise<void> => {
    config.value = await getConfig();
  };

  const loadFolders = async (): Promise<void> => {
    folders.value = await listFolderTree();
  };

  const saveConfig = async (): Promise<void> => {
    if (!config.value) return;

    saving.value = true;

    try {
      config.value = await updateConfig(config.value);
    } finally {
      saving.value = false;
    }
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
    closeWindow,
    config,
    createRootFolder,
    flatFolders,
    folderName,
    folderParentId,
    folders,
    loadFolders,
    removeFolder,
    saveConfig,
    saving,
    startDragWindow,
  };
};
