use std::fs;

use crate::models::app_paths::AppPaths;

pub fn get_app_data_path() -> Result<AppPaths, String> {
    let data_dir = dirs::data_dir()
        .ok_or_else(|| "failed to resolve data directory".to_string())?;

    let root_dir = data_dir.join("creeper-notes");
    let database_dir = root_dir.join("database");
    let config_dir = root_dir.join("config");
    let attachments_dir = root_dir.join("attachments");
    let cache_dir = root_dir.join("cache");

    fs::create_dir_all(&database_dir)
        .map_err(|error| error.to_string())?;

    fs::create_dir_all(&config_dir)
        .map_err(|error| error.to_string())?;

    fs::create_dir_all(&attachments_dir)
        .map_err(|error| error.to_string())?;

    fs::create_dir_all(&cache_dir)
        .map_err(|error| error.to_string())?;

    Ok(AppPaths {
        root_dir,
        database_dir,
        config_dir,
        attachments_dir,
        cache_dir,
    })
}
