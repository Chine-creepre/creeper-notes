use rusqlite::Connection;

pub fn initialize(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            r#"
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
            "#,
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}
