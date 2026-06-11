use rusqlite::Connection;

use crate::constants::note_constants::NOTES_TABLE_NAME;

pub fn initialize(connection: &Connection) -> Result<(), String> {
    let sql = format!(
        r#"
        CREATE TABLE IF NOT EXISTS {} (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            describe TEXT,
            content TEXT,
            readonly INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted INTEGER NOT NULL DEFAULT 0
        );
        "#,
        NOTES_TABLE_NAME,
    );

    connection
        .execute_batch(&sql)
        .map_err(|error| error.to_string())?;

    Ok(())
}
