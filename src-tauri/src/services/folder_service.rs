use std::collections::{HashMap, HashSet};
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::Connection;
use tauri::AppHandle;
use uuid::Uuid;

use crate::models::folder::{CreateFolderPayload, Folder, FolderTreeNode, UpdateFolderPayload};
use crate::repositories::{database_repository, folder_repository};
use crate::services::path_service;

fn get_current_timestamp() -> Result<i64, String> {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?;

    Ok(duration.as_millis() as i64)
}

fn get_connection(app: &AppHandle) -> Result<Connection, String> {
    let app_paths = path_service::get_app_data_path(app)?;
    let database_file_path = database_repository::get_database_file_path(&app_paths);

    Connection::open(database_file_path)
        .map_err(|error| error.to_string())
}

fn validate_folder_name(name: &str) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("folder name cannot be empty".to_string());
    }

    Ok(())
}

fn normalize_parent_id(parent_id: Option<String>) -> Option<String> {
    parent_id
        .map(|parent_id| parent_id.trim().to_string())
        .filter(|parent_id| !parent_id.is_empty())
}

fn append_child_to_tree(nodes: &mut Vec<FolderTreeNode>, parent_id: &str, child: FolderTreeNode) -> bool {
    for node in nodes {
        if node.id == parent_id {
            node.children.push(child);
            return true;
        }

        if append_child_to_tree(&mut node.children, parent_id, child.clone()) {
            return true;
        }
    }

    false
}

fn build_folder_tree(folders: Vec<Folder>) -> Vec<FolderTreeNode> {
    let folder_ids = folders
        .iter()
        .map(|folder| folder.id.clone())
        .collect::<HashSet<String>>();
    let mut root_nodes: Vec<FolderTreeNode> = folders
        .iter()
        .filter(|folder| {
            folder
                .parent_id
                .as_ref()
                .map(|parent_id| !folder_ids.contains(parent_id))
                .unwrap_or(true)
        })
        .cloned()
        .map(FolderTreeNode::from)
        .collect();
    let mut child_nodes = folders
        .into_iter()
        .filter(|folder| {
            folder
                .parent_id
                .as_ref()
                .map(|parent_id| folder_ids.contains(parent_id))
                .unwrap_or(false)
        })
        .map(FolderTreeNode::from)
        .collect::<Vec<FolderTreeNode>>();

    child_nodes.sort_by(|current, next| current.sort_order.cmp(&next.sort_order));

    while !child_nodes.is_empty() {
        let unresolved_count = child_nodes.len();
        let mut next_child_nodes = Vec::new();
        let current_child_nodes = child_nodes;

        for child_node in current_child_nodes {
            if let Some(parent_id) = child_node.parent_id.clone() {
                if !append_child_to_tree(&mut root_nodes, &parent_id, child_node.clone()) {
                    next_child_nodes.push(child_node);
                }
            }
        }

        if next_child_nodes.len() == unresolved_count {
            root_nodes.extend(next_child_nodes);
            break;
        }

        child_nodes = next_child_nodes;
    }

    root_nodes.sort_by(|current, next| current.sort_order.cmp(&next.sort_order));
    root_nodes
}

fn assert_folder_parent_is_not_descendant(
    folders: &[Folder],
    folder_id: &str,
    parent_id: &str,
) -> Result<(), String> {
    let parent_map = folders
        .iter()
        .map(|folder| (folder.id.clone(), folder.parent_id.clone()))
        .collect::<HashMap<String, Option<String>>>();
    let mut current_parent_id = Some(parent_id.to_string());

    while let Some(current_id) = current_parent_id {
        if current_id == folder_id {
            return Err("folder parent cannot be its descendant".to_string());
        }

        current_parent_id = parent_map
            .get(&current_id)
            .cloned()
            .unwrap_or(None);
    }

    Ok(())
}

pub fn create_folder(app: &AppHandle, payload: CreateFolderPayload) -> Result<Folder, String> {
    validate_folder_name(&payload.name)?;

    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;
    let parent_id = normalize_parent_id(payload.parent_id);

    if let Some(parent_id) = &parent_id {
        let parent_folder = folder_repository::find_folder_by_id(&connection, parent_id)?;

        if parent_folder.is_none() {
            return Err("parent folder not found".to_string());
        }
    }

    let folder = Folder {
        id: Uuid::new_v4().to_string(),
        parent_id,
        name: payload.name.trim().to_string(),
        sort_order: payload.sort_order.unwrap_or(0),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
    };

    folder_repository::create_folder(&connection, &folder)?;

    Ok(folder)
}

pub fn find_folder_by_id(app: &AppHandle, id: &str) -> Result<Option<Folder>, String> {
    let connection = get_connection(app)?;

    folder_repository::find_folder_by_id(&connection, id)
}

pub fn list_folders(app: &AppHandle) -> Result<Vec<Folder>, String> {
    let connection = get_connection(app)?;

    folder_repository::list_folders(&connection)
}

pub fn list_folder_tree(app: &AppHandle) -> Result<Vec<FolderTreeNode>, String> {
    let connection = get_connection(app)?;
    let folders = folder_repository::list_folders(&connection)?;

    Ok(build_folder_tree(folders))
}

pub fn update_folder(app: &AppHandle, payload: UpdateFolderPayload) -> Result<(), String> {
    validate_folder_name(&payload.name)?;

    let parent_id = normalize_parent_id(payload.parent_id);

    if parent_id.as_deref() == Some(payload.id.as_str()) {
        return Err("folder cannot be its own parent".to_string());
    }

    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    let folder = folder_repository::find_folder_by_id(&connection, &payload.id)?;

    if folder.is_none() {
        return Err("folder not found".to_string());
    }

    if let Some(parent_id) = &parent_id {
        let parent_folder = folder_repository::find_folder_by_id(&connection, parent_id)?;

        if parent_folder.is_none() {
            return Err("parent folder not found".to_string());
        }

        let folders = folder_repository::list_folders(&connection)?;
        assert_folder_parent_is_not_descendant(&folders, &payload.id, parent_id)?;
    }

    let payload = UpdateFolderPayload {
        id: payload.id,
        parent_id,
        name: payload.name.trim().to_string(),
        sort_order: payload.sort_order,
    };

    folder_repository::update_folder(&connection, &payload, timestamp)
}

pub fn delete_folder(app: &AppHandle, id: &str) -> Result<(), String> {
    let connection = get_connection(app)?;
    let timestamp = get_current_timestamp()?;

    let folder = folder_repository::find_folder_by_id(&connection, id)?;

    if folder.is_none() {
        return Err("folder not found".to_string());
    }

    let child_folder_count = folder_repository::count_child_folders(&connection, id)?;

    if child_folder_count > 0 {
        return Err("folder has child folders".to_string());
    }

    let note_count = folder_repository::count_notes_in_folder(&connection, id)?;

    if note_count > 0 {
        return Err("folder has notes".to_string());
    }

    folder_repository::delete_folder(&connection, id, timestamp)
}
