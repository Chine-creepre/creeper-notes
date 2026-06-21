use tauri::{AppHandle, Emitter};

use crate::models::app_config::AppConfig;
use crate::services::config_service;

const APP_CONFIG_CHANGED_EVENT: &str = "app-config-changed";

#[tauri::command]
pub fn get_config(app: AppHandle) -> Result<AppConfig, String> {
    config_service::get_config(&app)
}

#[tauri::command]
pub fn update_config(app: AppHandle, app_config: AppConfig) -> Result<AppConfig, String> {
    let updated_config = config_service::update_config(&app, app_config)?;

    app.emit(APP_CONFIG_CHANGED_EVENT, &updated_config)
        .map_err(|error| error.to_string())?;

    Ok(updated_config)
}

#[tauri::command]
pub fn reset_config(app: AppHandle) -> Result<AppConfig, String> {
    let app_config = config_service::reset_config(&app)?;

    app.emit(APP_CONFIG_CHANGED_EVENT, &app_config)
        .map_err(|error| error.to_string())?;

    Ok(app_config)
}
