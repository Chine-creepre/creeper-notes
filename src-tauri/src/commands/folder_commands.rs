use tauri::AppHandle;

use crate::models::folder::{CreateFolderPayload, Folder, UpdateFolderPayload};
use crate::services::folder_service;

#[tauri::command]
pub fn create_folder(app: AppHandle, payload: CreateFolderPayload) -> Result<Folder, String> {
    folder_service::create_folder(&app, payload)
}

#[tauri::command]
pub fn find_folder_by_id(app: AppHandle, id: String) -> Result<Option<Folder>, String> {
    folder_service::find_folder_by_id(&app, &id)
}

#[tauri::command]
pub fn list_folders(app: AppHandle) -> Result<Vec<Folder>, String> {
    folder_service::list_folders(&app)
}

#[tauri::command]
pub fn update_folder(app: AppHandle, payload: UpdateFolderPayload) -> Result<(), String> {
    folder_service::update_folder(&app, payload)
}

#[tauri::command]
pub fn delete_folder(app: AppHandle, id: String) -> Result<(), String> {
    folder_service::delete_folder(&app, &id)
}
