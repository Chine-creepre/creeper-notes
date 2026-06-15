use tauri::AppHandle;

use crate::models::note::{CreateNotePayload, Note, UpdateNotePayload};
use crate::models::note_query::NoteQuery;
use crate::models::page_result::PageResult;
use crate::services::note_service;

#[tauri::command]
pub fn create_note(app: AppHandle, payload: CreateNotePayload) -> Result<Note, String> {
    note_service::create_note(&app, payload)
}

#[tauri::command]
pub fn find_note_by_id(app: AppHandle, id: String) -> Result<Option<Note>, String> {
    note_service::find_note_by_id(&app, &id)
}

#[tauri::command]
pub fn list_notes(app: AppHandle, query: NoteQuery) -> Result<PageResult<Note>, String> {
    note_service::list_notes(&app, query)
}

#[tauri::command]
pub fn search_notes(app: AppHandle, query: NoteQuery) -> Result<PageResult<Note>, String> {
    note_service::search_notes(&app, query)
}

#[tauri::command]
pub fn update_note(app: AppHandle, payload: UpdateNotePayload) -> Result<(), String> {
    note_service::update_note(&app, payload)
}

#[tauri::command]
pub fn delete_note(app: AppHandle, id: String) -> Result<(), String> {
    note_service::delete_note(&app, &id)
}
