use std::fs;
use std::path::PathBuf;

use crate::models::app_paths::AppPaths;

const DATABASE_FILE_NAME: &str = "notes.db";

const INIT_NOTES_TABLE_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    describe TEXT,
    content TEXT,
    readonly INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
);
"#;

pub fn get_database_file_path(app_paths: &AppPaths) -> PathBuf {
    app_paths.database_dir.join(DATABASE_FILE_NAME)
}

pub fn initialize_database(app_paths: &AppPaths) -> Result<PathBuf, String> {
    let database_file_path = get_database_file_path(app_paths);

    if !database_file_path.exists() {
        fs::File::create(&database_file_path)
            .map_err(|error| error.to_string())?;
    }

    let database = sqlite::open(&database_file_path)
        .map_err(|error| error.to_string())?;

    database
        .execute(INIT_NOTES_TABLE_SQL)
        .map_err(|error| error.to_string())?;

    Ok(database_file_path)
}
