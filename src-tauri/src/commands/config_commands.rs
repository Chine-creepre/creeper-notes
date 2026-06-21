use tauri::AppHandle;

use crate::models::app_config::AppConfig;
use crate::services::config_service;

#[tauri::command]
pub fn get_config(app: AppHandle) -> Result<AppConfig, String> {
    config_service::get_config(&app)
}

#[tauri::command]
pub fn update_config(app: AppHandle, app_config: AppConfig) -> Result<AppConfig, String> {
    config_service::update_config(&app, app_config)
}

#[tauri::command]
pub fn reset_config(app: AppHandle) -> Result<AppConfig, String> {
    config_service::reset_config(&app)
}
