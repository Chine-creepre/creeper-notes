import { emit } from "@tauri-apps/api/event";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { HTreeNode } from "@/components/Tree/types";
import { APP_EVENTS } from "@/constants/events";
import {
  createFolder,
  deleteFolder,
  listFolderTree,
  updateFolder,
  type CreateFolderPayload,
  type FolderTreeNode,
  type UpdateFolderPayload,
} from "@/request/apis/notes";
import { sleep } from "@/utils/sleep";

const FOLDER_TREE_ICON = "lucide:folder";

const mapFolderToTreeNode = (folder: FolderTreeNode): HTreeNode => ({
  id: folder.id,
  label: folder.name,
  icon: FOLDER_TREE_ICON,
  raw: folder,
  children: folder.children.map(mapFolderToTreeNode),
});

const hasFolder = (folders: FolderTreeNode[], id: string): boolean =>
  folders.some((folder) => folder.id === id || hasFolder(folder.children, id));

export const useFolderStore = defineStore("folder", () => {
  const folders = ref<FolderTreeNode[]>([]);
  const activeFolderId = ref<string | null>(null);

  const folderTreeNodes = computed<HTreeNode[]>(() => folders.value.map(mapFolderToTreeNode));

  const loadFolders = async (): Promise<void> => {
    folders.value = await listFolderTree();
  };

  const normalizeActiveFolder = (): void => {
    if (!activeFolderId.value) return;
    if (hasFolder(folders.value, activeFolderId.value)) return;

    activeFolderId.value = null;
  };

  const syncFoldersChanged = async (): Promise<void> => {
    await loadFolders();
    normalizeActiveFolder();
  };

  const notifyFoldersChanged = async (): Promise<void> => {
    await emit(APP_EVENTS.foldersChanged);
  };

  const selectFolder = (node: HTreeNode | null): void => {
    activeFolderId.value = node?.id ?? null;
  };

  const createFolderItem = async (payload: CreateFolderPayload): Promise<void> => {
    await createFolder(payload);
    await sleep();
    await loadFolders();
    await notifyFoldersChanged();
  };

  const updateFolderItem = async (payload: UpdateFolderPayload): Promise<void> => {
    await updateFolder(payload);
    await sleep();
    await loadFolders();
    await notifyFoldersChanged();
  };

  const deleteFolderItem = async (id: string): Promise<void> => {
    await deleteFolder(id);
    await sleep();
    await loadFolders();
    normalizeActiveFolder();
    await notifyFoldersChanged();
  };

  return {
    activeFolderId,
    createFolderItem,
    deleteFolderItem,
    folderTreeNodes,
    folders,
    loadFolders,
    normalizeActiveFolder,
    selectFolder,
    syncFoldersChanged,
    updateFolderItem,
  };
});
