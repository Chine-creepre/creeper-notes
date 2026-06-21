use tauri::AppHandle;

use crate::services::window_service;

#[tauri::command]
pub fn open_search_window(app: AppHandle) -> Result<(), String> {
    window_service::open_search_window(&app)
}

#[tauri::command]
pub fn close_search_window(app: AppHandle) -> Result<(), String> {
    window_service::close_search_window(&app)
}

#[tauri::command]
pub fn toggle_search_window(app: AppHandle) -> Result<(), String> {
    window_service::toggle_search_window(&app)
}

#[tauri::command]
pub fn open_settings_window(app: AppHandle) -> Result<(), String> {
    window_service::open_settings_window(&app)
}

#[tauri::command]
pub fn close_settings_window(app: AppHandle) -> Result<(), String> {
    window_service::close_settings_window(&app)
}

#[tauri::command]
pub fn toggle_settings_window(app: AppHandle) -> Result<(), String> {
    window_service::toggle_settings_window(&app)
}

#[tauri::command]
pub fn show_main_window(app: AppHandle) -> Result<(), String> {
    window_service::show_main_window(&app)
}

#[tauri::command]
pub fn hide_main_window(app: AppHandle) -> Result<(), String> {
    window_service::hide_main_window(&app)
}

#[tauri::command]
pub fn toggle_main_window(app: AppHandle) -> Result<(), String> {
    window_service::toggle_main_window(&app)
}
