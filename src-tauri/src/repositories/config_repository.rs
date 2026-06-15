use std::fs;
use std::path::PathBuf;

use crate::constants::config_constants::CONFIG_FILE_NAME;
use crate::models::app_config::AppConfig;
use crate::models::app_paths::AppPaths;

pub fn get_config_file_path(app_paths: &AppPaths) -> PathBuf {
    app_paths.config_dir.join(CONFIG_FILE_NAME)
}

pub fn read_config(app_paths: &AppPaths) -> Result<Option<AppConfig>, String> {
    let config_file_path = get_config_file_path(app_paths);

    if !config_file_path.exists() {
        return Ok(None);
    }

    let config_content = fs::read_to_string(&config_file_path)
        .map_err(|error| error.to_string())?;

    let app_config = serde_json::from_str::<AppConfig>(&config_content)
        .map_err(|error| error.to_string())?;

    Ok(Some(app_config))
}

pub fn write_config(app_paths: &AppPaths, app_config: &AppConfig) -> Result<(), String> {
    let config_file_path = get_config_file_path(app_paths);
    let config_content = serde_json::to_string_pretty(app_config)
        .map_err(|error| error.to_string())?;

    fs::write(config_file_path, config_content)
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn initialize_config(app_paths: &AppPaths, default_config: &AppConfig) -> Result<AppConfig, String> {
    if let Some(app_config) = read_config(app_paths)? {
        return Ok(app_config);
    }

    write_config(app_paths, default_config)?;

    Ok(default_config.clone())
}
