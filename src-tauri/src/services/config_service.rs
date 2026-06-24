use tauri::AppHandle;

use crate::constants::config_constants::{
    DEFAULT_AUTO_START_ENABLED,
    DEFAULT_SEARCH_SHORTCUT,
    DEFAULT_THEME,
    DEFAULT_TOGGLE_SHORTCUT,
};
use crate::models::app_config::AppConfig;
use crate::models::app_paths::AppPaths;
use crate::repositories::config_repository;
use crate::services::{auto_start_service, path_service, shortcut_service};

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

#[cfg(windows)]
fn is_valid_shortcut(shortcut: &str) -> bool {
    shortcut
        .parse::<tauri_plugin_global_shortcut::Shortcut>()
        .is_ok()
}

#[cfg(not(windows))]
fn is_valid_shortcut(_shortcut: &str) -> bool {
    true
}

fn sanitize_config(app: &AppHandle, mut app_config: AppConfig) -> Result<AppConfig, String> {
    let app_paths = path_service::get_app_data_path(app)?;
    let mut changed = false;

    if !is_valid_shortcut(&app_config.toggle_shortcut) {
        app_config.toggle_shortcut = DEFAULT_TOGGLE_SHORTCUT.to_string();
        changed = true;
    }

    if !is_valid_shortcut(&app_config.search_shortcut) {
        app_config.search_shortcut = DEFAULT_SEARCH_SHORTCUT.to_string();
        changed = true;
    }

    if changed {
        config_repository::write_config(&app_paths, &app_config)?;
    }

    Ok(app_config)
}

fn sync_auto_start_state(
    app: &AppHandle,
    app_paths: &AppPaths,
    mut app_config: AppConfig,
) -> Result<AppConfig, String> {
    let auto_start_enabled = auto_start_service::is_auto_start_enabled(app)?;

    if app_config.auto_start_enabled == auto_start_enabled {
        return Ok(app_config);
    }

    app_config.auto_start_enabled = auto_start_enabled;
    config_repository::write_config(app_paths, &app_config)?;

    Ok(app_config)
}

pub fn initialize_config(app: &AppHandle) -> Result<AppConfig, String> {
    let app_paths = path_service::get_app_data_path(app)?;
    let default_config = create_default_config(app)?;
    let app_config = config_repository::initialize_config(&app_paths, &default_config)?;
    let app_config = sanitize_config(app, app_config)?;

    sync_auto_start_state(app, &app_paths, app_config)
}

pub fn get_config(app: &AppHandle) -> Result<AppConfig, String> {
    initialize_config(app)
}

pub fn update_config(app: &AppHandle, app_config: AppConfig) -> Result<AppConfig, String> {
    let app_paths = path_service::get_app_data_path(app)?;
    let app_config = sanitize_config(app, app_config)?;

    auto_start_service::sync_auto_start(app, app_config.auto_start_enabled)?;
    config_repository::write_config(&app_paths, &app_config)?;
    shortcut_service::reload_shortcuts(app)?;

    Ok(app_config)
}

pub fn reset_config(app: &AppHandle) -> Result<AppConfig, String> {
    let app_paths = path_service::get_app_data_path(app)?;
    let app_config = create_default_config(app)?;

    auto_start_service::sync_auto_start(app, app_config.auto_start_enabled)?;
    config_repository::write_config(&app_paths, &app_config)?;
    shortcut_service::reload_shortcuts(app)?;

    Ok(app_config)
}
