use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub describe: Option<String>,
    pub content: Option<String>,
    pub readonly: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNotePayload {
    pub title: String,
    pub describe: Option<String>,
    pub content: Option<String>,
    pub readonly: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateNotePayload {
    pub id: String,
    pub title: String,
    pub describe: Option<String>,
    pub content: Option<String>,
    pub readonly: bool,
}
