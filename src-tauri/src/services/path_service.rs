use std::fs;
use std::path::PathBuf;

pub fn get_app_data_path() -> Result<PathBuf, String> {
    let data_dir = dirs::data_dir()
        .ok_or_else(|| "failed to resolve data directory".to_string())?;

    let app_data_path = data_dir.join("creeper-notes");

    fs::create_dir_all(&app_data_path)
        .map_err(|error| error.to_string())?;

    Ok(app_data_path)
}
