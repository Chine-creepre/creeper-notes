use std::path::PathBuf;

use crate::models::app_paths::AppPaths;

const DATABASE_FILE_NAME: &str = "notes.db";

pub fn get_database_file_path(app_paths: &AppPaths) -> PathBuf {
    app_paths.database_dir.join(DATABASE_FILE_NAME)
}

pub fn initialize_database(app_paths: &AppPaths) -> Result<PathBuf, String> {
    let database_file_path = get_database_file_path(app_paths);

    Ok(database_file_path)
}
