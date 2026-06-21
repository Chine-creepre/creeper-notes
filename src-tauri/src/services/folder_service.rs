use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::Connection;
use tauri::AppHandle;
use uuid::Uuid;

use crate::models::folder::{CreateFolderPayload, Folder, UpdateFolderPayload};
use crate::repositories::{database_repository, folder_repository};
use crate::services::path_service;

fn get_current_timestamp() -> Result<i64, String> {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?;

    Ok(duration.as_millis() as i64)
}

fn get_connection(app: &AppHandle) -> Result<Connection, String> {
    let app_paths = path_service::get_app_data_path(app)?;
    let database_file_path = database_repository::get_database_file_path(&app_paths);

    Connection::open(database_file_path)
        .map_err(|error| error.to_string())
}

fn validate_folder_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("folder name cannot be empty".to_string());
    }

    Ok(())
}

pub fn create_folder(app: &AppHandle, payload: CreateFolderPayload) -> Result<Folder, String> {
    validate_folder_name(&payload.name)?;

    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    if let Some(parent_id) = &payload.parent_id {
        let parent_folder = folder_repository::find_folder_by_id(&connection, parent_id)?;

        if parent_folder.is_none() {
            return Err("parent folder not found".to_string());
        }
    }

    let folder = Folder {
        id: Uuid::new_v4().to_string(),
        parent_id: payload.parent_id,
        name: payload.name.trim().to_string(),
        sort_order: payload.sort_order.unwrap_or(0),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
    };

    folder_repository::create_folder(&connection, &folder)?;

    Ok(folder)
}

pub fn find_folder_by_id(app: &AppHandle, id: &str) -> Result<Option<Folder>, String> {
    let connection = get_connection(app)?;

    folder_repository::find_folder_by_id(&connection, id)
}

pub fn list_folders(app: &AppHandle) -> Result<Vec<Folder>, String> {
    let connection = get_connection(app)?;

    folder_repository::list_folders(&connection)
}

pub fn update_folder(app: &AppHandle, payload: UpdateFolderPayload) -> Result<(), String> {
    validate_folder_name(&payload.name)?;

    if payload.parent_id.as_deref() == Some(payload.id.as_str()) {
        return Err("folder cannot be its own parent".to_string());
    }

    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    let folder = folder_repository::find_folder_by_id(&connection, &payload.id)?;

    if folder.is_none() {
        return Err("folder not found".to_string());
    }

    if let Some(parent_id) = &payload.parent_id {
        let parent_folder = folder_repository::find_folder_by_id(&connection, parent_id)?;

        if parent_folder.is_none() {
            return Err("parent folder not found".to_string());
        }
    }

    folder_repository::update_folder(&connection, &payload, timestamp)
}

pub fn delete_folder(app: &AppHandle, id: &str) -> Result<(), String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    let folder = folder_repository::find_folder_by_id(&connection, id)?;

    if folder.is_none() {
        return Err("folder not found".to_string());
    }

    let child_folder_count = folder_repository::count_child_folders(&connection, id)?;

    if child_folder_count > 0 {
        return Err("folder has child folders".to_string());
    }

    let note_count = folder_repository::count_notes_in_folder(&connection, id)?;

    if note_count > 0 {
        return Err("folder has notes".to_string());
    }

    folder_repository::delete_folder(&connection, id, timestamp)
}
