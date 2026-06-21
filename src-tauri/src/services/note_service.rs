use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::Connection;
use tauri::AppHandle;
use uuid::Uuid;

use crate::models::note::{CreateNotePayload, Note, UpdateNotePayload};
use crate::models::note_query::NoteQuery;
use crate::models::page_result::PageResult;
use crate::repositories::{database_repository, folder_repository, note_repository};
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

fn normalize_folder_id(folder_id: Option<String>) -> Option<String> {
    folder_id
        .map(|folder_id| folder_id.trim().to_string())
        .filter(|folder_id| !folder_id.is_empty())
}

fn validate_folder_id(connection: &Connection, folder_id: &Option<String>) -> Result<(), String> {
    if let Some(folder_id) = folder_id {
        let folder = folder_repository::find_folder_by_id(connection, folder_id)?;

        if folder.is_none() {
            return Err("folder not found".to_string());
        }
    }

    Ok(())
}

pub fn create_note(app: &AppHandle, payload: CreateNotePayload) -> Result<Note, String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;
    let folder_id = normalize_folder_id(payload.folder_id);

    validate_folder_id(&connection, &folder_id)?;

    let note_id = Uuid::new_v4().to_string();
    let note = Note {
        id: note_id.clone(),
        title: payload.title,
        describe: payload.describe,
        content: payload.content,
        readonly: payload.readonly,
        folder_id,
        folder: None,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
    };

    note_repository::create_note(&connection, &note)?;

    note_repository::find_note_by_id(&connection, &note_id)?
        .ok_or_else(|| "created note not found".to_string())
}

pub fn find_note_by_id(app: &AppHandle, id: &str) -> Result<Option<Note>, String> {
    let connection = get_connection(app)?;

    note_repository::find_note_by_id(&connection, id)
}

pub fn list_notes(app: &AppHandle, query: NoteQuery) -> Result<PageResult<Note>, String> {
    let connection = get_connection(app)?;

    note_repository::list_notes(&connection, &query)
}

pub fn search_notes(app: &AppHandle, query: NoteQuery) -> Result<PageResult<Note>, String> {
    let connection = get_connection(app)?;

    note_repository::search_notes(&connection, &query)
}

pub fn update_note(app: &AppHandle, payload: UpdateNotePayload) -> Result<(), String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;
    let folder_id = normalize_folder_id(payload.folder_id);

    validate_folder_id(&connection, &folder_id)?;

    let payload = UpdateNotePayload {
        id: payload.id,
        title: payload.title,
        describe: payload.describe,
        content: payload.content,
        readonly: payload.readonly,
        folder_id,
    };

    note_repository::update_note(&connection, &payload, timestamp)
}

pub fn delete_note(app: &AppHandle, id: &str) -> Result<(), String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    note_repository::delete_note(&connection, id, timestamp)
}
