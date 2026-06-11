use rusqlite::{params, Connection};

use crate::constants::note_constants::NOTES_TABLE_NAME;
use crate::models::note::{Note, UpdateNotePayload};

pub fn create_note(connection: &Connection, note: &Note) -> Result<(), String> {
    let sql = format!(
        r#"
        INSERT INTO {} (
            id,
            title,
            describe,
            content,
            readonly,
            created_at,
            updated_at,
            deleted
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        NOTES_TABLE_NAME,
    );

    connection
        .execute(
            &sql,
            params![
                note.id,
                note.title,
                note.describe,
                note.content,
                note.readonly,
                note.created_at,
                note.updated_at,
                note.deleted,
            ],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn find_note_by_id(connection: &Connection, id: &str) -> Result<Option<Note>, String> {
    let sql = format!(
        r#"
        SELECT
            id,
            title,
            describe,
            content,
            readonly,
            created_at,
            updated_at,
            deleted
        FROM {}
        WHERE id = ?1
        LIMIT 1
        "#,
        NOTES_TABLE_NAME,
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;

    let mut rows = statement
        .query(params![id])
        .map_err(|error| error.to_string())?;

    if let Some(row) = rows.next().map_err(|error| error.to_string())? {
        return Ok(Some(Note {
            id: row.get(0).map_err(|error| error.to_string())?,
            title: row.get(1).map_err(|error| error.to_string())?,
            describe: row.get(2).map_err(|error| error.to_string())?,
            content: row.get(3).map_err(|error| error.to_string())?,
            readonly: row.get(4).map_err(|error| error.to_string())?,
            created_at: row.get(5).map_err(|error| error.to_string())?,
            updated_at: row.get(6).map_err(|error| error.to_string())?,
            deleted: row.get(7).map_err(|error| error.to_string())?,
        }));
    }

    Ok(None)
}

pub fn list_notes(connection: &Connection) -> Result<Vec<Note>, String> {
    let sql = format!(
        r#"
        SELECT
            id,
            title,
            describe,
            content,
            readonly,
            created_at,
            updated_at,
            deleted
        FROM {}
        WHERE deleted = 0
        ORDER BY updated_at DESC
        "#,
        NOTES_TABLE_NAME,
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;

    let notes = statement
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                describe: row.get(2)?,
                content: row.get(3)?,
                readonly: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                deleted: row.get(7)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<Note>, rusqlite::Error>>()
        .map_err(|error| error.to_string())?;

    Ok(notes)
}

pub fn search_notes(connection: &Connection, keyword: &str) -> Result<Vec<Note>, String> {
    let like_keyword = format!("%{}%", keyword);
    let sql = format!(
        r#"
        SELECT
            id,
            title,
            describe,
            content,
            readonly,
            created_at,
            updated_at,
            deleted
        FROM {}
        WHERE deleted = 0
          AND (
            title LIKE ?1
            OR describe LIKE ?1
            OR content LIKE ?1
          )
        ORDER BY updated_at DESC
        "#,
        NOTES_TABLE_NAME,
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;

    let notes = statement
        .query_map(params![like_keyword], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                describe: row.get(2)?,
                content: row.get(3)?,
                readonly: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                deleted: row.get(7)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<Note>, rusqlite::Error>>()
        .map_err(|error| error.to_string())?;

    Ok(notes)
}

pub fn update_note(
    connection: &Connection,
    payload: &UpdateNotePayload,
    updated_at: i64,
) -> Result<(), String> {
    let sql = format!(
        r#"
        UPDATE {}
        SET
            title = ?2,
            describe = ?3,
            content = ?4,
            readonly = ?5,
            updated_at = ?6
        WHERE id = ?1
          AND deleted = 0
        "#,
        NOTES_TABLE_NAME,
    );

    connection
        .execute(
            &sql,
            params![
                payload.id,
                payload.title,
                payload.describe,
                payload.content,
                payload.readonly,
                updated_at,
            ],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn delete_note(connection: &Connection, id: &str, updated_at: i64) -> Result<(), String> {
    let sql = format!(
        r#"
        UPDATE {}
        SET
            deleted = 1,
            updated_at = ?2
        WHERE id = ?1
        "#,
        NOTES_TABLE_NAME,
    );

    connection
        .execute(&sql, params![id, updated_at])
        .map_err(|error| error.to_string())?;

    Ok(())
}
