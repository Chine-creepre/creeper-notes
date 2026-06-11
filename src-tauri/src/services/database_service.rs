use tauri::AppHandle;

use crate::repositories::database_repository;
use crate::services::path_service;

pub fn initialize_database(app: &AppHandle) -> Result<(), String> {
    let app_paths = path_service::get_app_data_path(app)?;

    database_repository::initialize_database(&app_paths)?;

    Ok(())
}
