use crate::services::path_service;

#[tauri::command]
pub fn get_data_path(app: tauri::AppHandle) -> Result<String, String> {
    let app_paths = path_service::get_app_data_path(&app)?;

    Ok(app_paths.root_dir.to_string_lossy().to_string())
}
