use rusqlite::Connection;

use crate::constants::note_constants::NOTES_TABLE_NAME;

fn ensure_folder_id_column(connection: &Connection) -> Result<(), String> {
    let mut statement = connection
        .prepare(&format!("PRAGMA table_info({})", NOTES_TABLE_NAME))
        .map_err(|error| error.to_string())?;

    let columns = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<String>, rusqlite::Error>>()
        .map_err(|error| error.to_string())?;

    if columns.iter().any(|column| column == "folder_id") {
        return Ok(());
    }

    let sql = format!(
        r#"
        ALTER TABLE {}
        ADD COLUMN folder_id TEXT;
        "#,
        NOTES_TABLE_NAME,
    );

    connection
        .execute_batch(&sql)
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn initialize(connection: &Connection) -> Result<(), String> {
    let sql = format!(
        r#"
        CREATE TABLE IF NOT EXISTS {} (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            describe TEXT,
            content TEXT,
            readonly INTEGER NOT NULL DEFAULT 0,
            folder_id TEXT,
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

    ensure_folder_id_column(connection)?;

    Ok(())
}
