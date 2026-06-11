use crate::services::path_service;

#[tauri::command]
pub fn get_data_path() -> Result<String, String> {
    let app_data_path = path_service::get_app_data_path()?;

    Ok(app_data_path.to_string_lossy().to_string())
}
