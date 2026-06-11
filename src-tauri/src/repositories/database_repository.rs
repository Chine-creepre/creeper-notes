use std::fs;
use std::path::PathBuf;

use rusqlite::Connection;

use crate::models::app_paths::AppPaths;
use crate::repositories::tables::notes_table;

const DATABASE_FILE_NAME: &str = "notes.db";

pub fn get_database_file_path(app_paths: &AppPaths) -> PathBuf {
    app_paths.database_dir.join(DATABASE_FILE_NAME)
}

pub fn initialize_database(app_paths: &AppPaths) -> Result<PathBuf, String> {
    let database_file_path = get_database_file_path(app_paths);

    if !database_file_path.exists() {
        fs::File::create(&database_file_path)
            .map_err(|error| error.to_string())?;
    }

    let connection = Connection::open(&database_file_path)
        .map_err(|error| error.to_string())?;

    notes_table::initialize(&connection)?;

    Ok(database_file_path)
}
