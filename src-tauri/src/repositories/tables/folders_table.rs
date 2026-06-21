use rusqlite::Connection;

use crate::constants::folder_constants::FOLDERS_TABLE_NAME;

pub fn initialize(connection: &Connection) -> Result<(), String> {
    let sql = format!(
        r#"
        CREATE TABLE IF NOT EXISTS {} (
            id TEXT PRIMARY KEY,
            parent_id TEXT,
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted INTEGER NOT NULL DEFAULT 0
        );
        "#,
        FOLDERS_TABLE_NAME,
    );

    connection
        .execute_batch(&sql)
        .map_err(|error| error.to_string())?;

    Ok(())
}
