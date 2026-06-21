use rusqlite::{params, Connection};

use crate::constants::folder_constants::FOLDERS_TABLE_NAME;
use crate::constants::note_constants::NOTES_TABLE_NAME;
use crate::models::folder::{Folder, UpdateFolderPayload};

fn map_folder_row(row: &rusqlite::Row) -> rusqlite::Result<Folder> {
    Ok(Folder {
        id: row.get(0)?,
        parent_id: row.get(1)?,
        name: row.get(2)?,
        sort_order: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
        deleted: row.get(6)?,
    })
}

pub fn create_folder(connection: &Connection, folder: &Folder) -> Result<(), String> {
    let sql = format!(
        r#"
        INSERT INTO {} (
            id,
            parent_id,
            name,
            sort_order,
            created_at,
            updated_at,
            deleted
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        "#,
        FOLDERS_TABLE_NAME,
    );

    connection
        .execute(
            &sql,
            params![
                folder.id,
                folder.parent_id,
                folder.name,
                folder.sort_order,
                folder.created_at,
                folder.updated_at,
                folder.deleted,
            ],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn find_folder_by_id(connection: &Connection, id: &str) -> Result<Option<Folder>, String> {
    let sql = format!(
        r#"
        SELECT
            id,
            parent_id,
            name,
            sort_order,
            created_at,
            updated_at,
            deleted
        FROM {}
        WHERE id = ?1
        LIMIT 1
        "#,
        FOLDERS_TABLE_NAME,
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;

    let mut rows = statement
        .query(params![id])
        .map_err(|error| error.to_string())?;

    if let Some(row) = rows.next().map_err(|error| error.to_string())? {
        return Ok(Some(map_folder_row(row).map_err(|error| error.to_string())?));
    }

    Ok(None)
}

pub fn list_folders(connection: &Connection) -> Result<Vec<Folder>, String> {
    let sql = format!(
        r#"
        SELECT
            id,
            parent_id,
            name,
            sort_order,
            created_at,
            updated_at,
            deleted
        FROM {}
        WHERE deleted = 0
        ORDER BY sort_order ASC, created_at ASC
        "#,
        FOLDERS_TABLE_NAME,
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;

    let folders = statement
        .query_map([], map_folder_row)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<Folder>, rusqlite::Error>>()
        .map_err(|error| error.to_string())?;

    Ok(folders)
}

pub fn update_folder(
    connection: &Connection,
    payload: &UpdateFolderPayload,
    updated_at: i64,
) -> Result<(), String> {
    let sql = format!(
        r#"
        UPDATE {}
        SET
            parent_id = ?2,
            name = ?3,
            sort_order = ?4,
            updated_at = ?5
        WHERE id = ?1
          AND deleted = 0
        "#,
        FOLDERS_TABLE_NAME,
    );

    connection
        .execute(
            &sql,
            params![
                payload.id,
                payload.parent_id,
                payload.name,
                payload.sort_order,
                updated_at,
            ],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn count_child_folders(connection: &Connection, parent_id: &str) -> Result<u64, String> {
    let sql = format!(
        r#"
        SELECT COUNT(*)
        FROM {}
        WHERE parent_id = ?1
          AND deleted = 0
        "#,
        FOLDERS_TABLE_NAME,
    );

    connection
        .query_row(&sql, params![parent_id], |row| row.get::<_, u64>(0))
        .map_err(|error| error.to_string())
}

pub fn count_notes_in_folder(connection: &Connection, folder_id: &str) -> Result<u64, String> {
    let sql = format!(
        r#"
        SELECT COUNT(*)
        FROM {}
        WHERE folder_id = ?1
          AND deleted = 0
        "#,
        NOTES_TABLE_NAME,
    );

    connection
        .query_row(&sql, params![folder_id], |row| row.get::<_, u64>(0))
        .map_err(|error| error.to_string())
}

pub fn delete_folder(connection: &Connection, id: &str, updated_at: i64) -> Result<(), String> {
    let sql = format!(
        r#"
        UPDATE {}
        SET
            deleted = 1,
            updated_at = ?2
        WHERE id = ?1
          AND deleted = 0
        "#,
        FOLDERS_TABLE_NAME,
    );

    connection
        .execute(&sql, params![id, updated_at])
        .map_err(|error| error.to_string())?;

    Ok(())
}
