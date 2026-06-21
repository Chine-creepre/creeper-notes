import { invoke } from "@tauri-apps/api/core";

export interface Folder {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted: boolean;
}

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
}

export interface Note {
  id: string;
  title: string;
  describe: string | null;
  content: string | null;
  readonly: boolean;
  folder_id: string | null;
  folder: Folder | null;
  created_at: number;
  updated_at: number;
  deleted: boolean;
}

export interface PageResult<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface NoteQuery {
  keyword?: string | null;
  folder_id?: string | null;
  root_only?: boolean | null;
  page?: number | null;
  page_size?: number | null;
}

export interface CreateFolderPayload {
  parent_id: string | null;
  name: string;
  sort_order?: number | null;
}

export interface UpdateFolderPayload {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
}

export interface CreateNotePayload {
  title: string;
  describe: string | null;
  content: string | null;
  readonly: boolean;
  folder_id: string | null;
}

export interface UpdateNotePayload extends CreateNotePayload {
  id: string;
}

export const listFolderTree = (): Promise<FolderTreeNode[]> => invoke("list_folder_tree");

export const createFolder = (payload: CreateFolderPayload): Promise<Folder> =>
  invoke("create_folder", { payload });

export const updateFolder = (payload: UpdateFolderPayload): Promise<void> =>
  invoke("update_folder", { payload });

export const deleteFolder = (id: string): Promise<void> => invoke("delete_folder", { id });

export const listNotes = (query: NoteQuery): Promise<PageResult<Note>> =>
  invoke("list_notes", { query });

export const searchNotes = (query: NoteQuery): Promise<PageResult<Note>> =>
  invoke("search_notes", { query });

export const createNote = (payload: CreateNotePayload): Promise<Note> =>
  invoke("create_note", { payload });

export const updateNote = (payload: UpdateNotePayload): Promise<Note> =>
  invoke("update_note", { payload });

export const moveNoteToFolder = (id: string, folderId: string | null): Promise<Note> =>
  invoke("move_note_to_folder", { id, folder_id: folderId });
