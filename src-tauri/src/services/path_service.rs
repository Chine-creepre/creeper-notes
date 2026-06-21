use std::fs;

use tauri::{AppHandle, Manager};

use crate::models::app_paths::AppPaths;

pub fn get_app_data_path(app: &AppHandle) -> Result<AppPaths, String> {
    let root_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    let database_dir = root_dir.join("database");
    let config_dir = root_dir.join("config");
    let attachments_dir = root_dir.join("attachments");
    let cache_dir = root_dir.join("cache");

    fs::create_dir_all(&database_dir).map_err(|error| error.to_string())?;

    fs::create_dir_all(&config_dir).map_err(|error| error.to_string())?;

    fs::create_dir_all(&attachments_dir).map_err(|error| error.to_string())?;

    fs::create_dir_all(&cache_dir).map_err(|error| error.to_string())?;

    Ok(AppPaths {
        root_dir,
        database_dir,
        config_dir,
    })
}
