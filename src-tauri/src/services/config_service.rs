use tauri::AppHandle;

use crate::constants::config_constants::{
    DEFAULT_AUTO_START_ENABLED,
    DEFAULT_SEARCH_SHORTCUT,
    DEFAULT_THEME,
    DEFAULT_TOGGLE_SHORTCUT,
};
use crate::models::app_config::AppConfig;
use crate::repositories::config_repository;
use crate::services::{auto_start_service, path_service};

fn create_default_config(app: &AppHandle) -> Result<AppConfig, String> {
    let app_paths = path_service::get_app_data_path(app)?;

    Ok(AppConfig {
        theme: DEFAULT_THEME.to_string(),
        toggle_shortcut: DEFAULT_TOGGLE_SHORTCUT.to_string(),
        search_shortcut: DEFAULT_SEARCH_SHORTCUT.to_string(),
        data_path: app_paths.root_dir.to_string_lossy().to_string(),
        auto_start_enabled: DEFAULT_AUTO_START_ENABLED,
    })
}

pub fn initialize_config(app: &AppHandle) -> Result<AppConfig, String> {
    let app_paths = path_service::get_app_data_path(app)?;
    let default_config = create_default_config(app)?;

    config_repository::initialize_config(&app_paths, &default_config)
}

pub fn get_config(app: &AppHandle) -> Result<AppConfig, String> {
    initialize_config(app)
}

pub fn update_config(app: &AppHandle, app_config: AppConfig) -> Result<AppConfig, String> {
    let app_paths = path_service::get_app_data_path(app)?;

    auto_start_service::sync_auto_start(app, app_config.auto_start_enabled)?;
    config_repository::write_config(&app_paths, &app_config)?;

    Ok(app_config)
}
