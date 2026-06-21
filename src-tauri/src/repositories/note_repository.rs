use rusqlite::{params, params_from_iter, Connection, ToSql};

use crate::constants::folder_constants::FOLDERS_TABLE_NAME;
use crate::constants::note_constants::NOTES_TABLE_NAME;
use crate::models::folder::Folder;
use crate::models::note::{Note, UpdateNotePayload};
use crate::models::note_query::NoteQuery;
use crate::models::page_result::PageResult;

fn get_note_select_sql() -> String {
    format!(
        r#"
        SELECT
            notes.id,
            notes.title,
            notes.describe,
            notes.content,
            notes.readonly,
            notes.folder_id,
            notes.created_at,
            notes.updated_at,
            notes.deleted,
            folders.id,
            folders.parent_id,
            folders.name,
            folders.sort_order,
            folders.created_at,
            folders.updated_at,
            folders.deleted
        FROM {} AS notes
        LEFT JOIN {} AS folders
          ON notes.folder_id = folders.id
         AND folders.deleted = 0
        "#,
        NOTES_TABLE_NAME,
        FOLDERS_TABLE_NAME,
    )
}

fn map_note_row(row: &rusqlite::Row) -> rusqlite::Result<Note> {
    let folder_id: Option<String> = row.get(5)?;
    let folder = if row.get::<_, Option<String>>(9)?.is_some() {
        Some(Folder {
            id: row.get(9)?,
            parent_id: row.get(10)?,
            name: row.get(11)?,
            sort_order: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
            deleted: row.get(15)?,
        })
    } else {
        None
    };

    Ok(Note {
        id: row.get(0)?,
        title: row.get(1)?,
        describe: row.get(2)?,
        content: row.get(3)?,
        readonly: row.get(4)?,
        folder_id,
        folder,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
        deleted: row.get(8)?,
    })
}

fn append_folder_filter(
    query: &NoteQuery,
    conditions: &mut Vec<String>,
    values: &mut Vec<Box<dyn ToSql>>,
) {
    if let Some(folder_id) = query.get_folder_id() {
        conditions.push("notes.folder_id = ?".to_string());
        values.push(Box::new(folder_id));
        return;
    }

    if query.is_root_only() {
        conditions.push("notes.folder_id IS NULL".to_string());
    }
}

fn get_value_refs(values: &[Box<dyn ToSql>]) -> Vec<&dyn ToSql> {
    values
        .iter()
        .map(|value| value.as_ref() as &dyn ToSql)
        .collect()
}

pub fn create_note(connection: &Connection, note: &Note) -> Result<(), String> {
    let sql = format!(
        r#"
        INSERT INTO {} (
            id,
            title,
            describe,
            content,
            readonly,
            folder_id,
            created_at,
            updated_at,
            deleted
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
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
                note.folder_id,
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
        {}
        WHERE notes.id = ?1
        LIMIT 1
        "#,
        get_note_select_sql(),
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;

    let mut rows = statement
        .query(params![id])
        .map_err(|error| error.to_string())?;

    if let Some(row) = rows.next().map_err(|error| error.to_string())? {
        return Ok(Some(map_note_row(row).map_err(|error| error.to_string())?));
    }

    Ok(None)
}

pub fn list_notes(connection: &Connection, query: &NoteQuery) -> Result<PageResult<Note>, String> {
    let page = query.get_page();
    let page_size = query.get_page_size();
    let offset = query.get_offset();
    let mut conditions = vec!["notes.deleted = 0".to_string()];
    let mut count_values: Vec<Box<dyn ToSql>> = Vec::new();

    append_folder_filter(query, &mut conditions, &mut count_values);

    let where_sql = conditions.join(" AND ");
    let count_sql = format!(
        r#"
        SELECT COUNT(*)
        FROM {} AS notes
        WHERE {}
        "#,
        NOTES_TABLE_NAME,
        where_sql,
    );
    let count_value_refs = get_value_refs(&count_values);

    let total = connection
        .query_row(&count_sql, params_from_iter(count_value_refs), |row| row.get::<_, u64>(0))
        .map_err(|error| error.to_string())?;

    let mut list_values: Vec<Box<dyn ToSql>> = Vec::new();
    append_folder_filter(query, &mut Vec::new(), &mut list_values);
    list_values.push(Box::new(page_size));
    list_values.push(Box::new(offset));

    let sql = format!(
        r#"
        {}
        WHERE {}
        ORDER BY notes.updated_at DESC
        LIMIT ?
        OFFSET ?
        "#,
        get_note_select_sql(),
        where_sql,
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;
    let list_value_refs = get_value_refs(&list_values);

    let items = statement
        .query_map(params_from_iter(list_value_refs), map_note_row)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<Note>, rusqlite::Error>>()
        .map_err(|error| error.to_string())?;

    Ok(PageResult {
        total,
        page,
        page_size,
        items,
    })
}

pub fn search_notes(connection: &Connection, query: &NoteQuery) -> Result<PageResult<Note>, String> {
    let Some(keyword) = query.get_keyword() else {
        return list_notes(connection, query);
    };

    let page = query.get_page();
    let page_size = query.get_page_size();
    let offset = query.get_offset();
    let like_keyword = format!("%{}%", keyword);
    let mut conditions = vec![
        "notes.deleted = 0".to_string(),
        "(notes.title LIKE ? OR notes.describe LIKE ? OR notes.content LIKE ?)".to_string(),
    ];
    let mut count_values: Vec<Box<dyn ToSql>> = vec![
        Box::new(like_keyword.clone()),
        Box::new(like_keyword.clone()),
        Box::new(like_keyword.clone()),
    ];

    append_folder_filter(query, &mut conditions, &mut count_values);

    let where_sql = conditions.join(" AND ");
    let count_sql = format!(
        r#"
        SELECT COUNT(*)
        FROM {} AS notes
        WHERE {}
        "#,
        NOTES_TABLE_NAME,
        where_sql,
    );
    let count_value_refs = get_value_refs(&count_values);

    let total = connection
        .query_row(&count_sql, params_from_iter(count_value_refs), |row| row.get::<_, u64>(0))
        .map_err(|error| error.to_string())?;

    let mut list_values: Vec<Box<dyn ToSql>> = vec![
        Box::new(like_keyword.clone()),
        Box::new(like_keyword.clone()),
        Box::new(like_keyword),
    ];
    append_folder_filter(query, &mut Vec::new(), &mut list_values);
    list_values.push(Box::new(page_size));
    list_values.push(Box::new(offset));

    let sql = format!(
        r#"
        {}
        WHERE {}
        ORDER BY notes.updated_at DESC
        LIMIT ?
        OFFSET ?
        "#,
        get_note_select_sql(),
        where_sql,
    );

    let mut statement = connection
        .prepare(&sql)
        .map_err(|error| error.to_string())?;
    let list_value_refs = get_value_refs(&list_values);

    let items = statement
        .query_map(params_from_iter(list_value_refs), map_note_row)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<Note>, rusqlite::Error>>()
        .map_err(|error| error.to_string())?;

    Ok(PageResult {
        total,
        page,
        page_size,
        items,
    })
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
            folder_id = ?6,
            updated_at = ?7
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
                payload.folder_id,
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
