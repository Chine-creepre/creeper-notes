#[tauri::command]
pub fn get_data_path() -> Result<String, String> {
    let data_dir = dirs::data_dir()
        .ok_or_else(|| "failed to resolve data directory".to_string())?;

    Ok(data_dir.to_string_lossy().to_string())
}
