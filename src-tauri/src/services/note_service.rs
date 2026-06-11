use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::Connection;
use tauri::AppHandle;
use uuid::Uuid;

use crate::models::note::{CreateNotePayload, Note, UpdateNotePayload};
use crate::repositories::{database_repository, note_repository};
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

pub fn create_note(app: &AppHandle, payload: CreateNotePayload) -> Result<Note, String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    let note = Note {
        id: Uuid::new_v4().to_string(),
        title: payload.title,
        describe: payload.describe,
        content: payload.content,
        readonly: payload.readonly,
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
    };

    note_repository::create_note(&connection, &note)?;

    Ok(note)
}

pub fn find_note_by_id(app: &AppHandle, id: &str) -> Result<Option<Note>, String> {
    let connection = get_connection(app)?;

    note_repository::find_note_by_id(&connection, id)
}

pub fn list_notes(app: &AppHandle) -> Result<Vec<Note>, String> {
    let connection = get_connection(app)?;

    note_repository::list_notes(&connection)
}

pub fn search_notes(app: &AppHandle, keyword: &str) -> Result<Vec<Note>, String> {
    let connection = get_connection(app)?;

    note_repository::search_notes(&connection, keyword)
}

pub fn update_note(app: &AppHandle, payload: UpdateNotePayload) -> Result<(), String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    note_repository::update_note(&connection, &payload, timestamp)
}

pub fn delete_note(app: &AppHandle, id: &str) -> Result<(), String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    note_repository::delete_note(&connection, id, timestamp)
}
