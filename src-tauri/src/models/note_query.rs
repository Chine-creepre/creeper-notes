use serde::{Deserialize, Serialize};

use crate::constants::note_constants::DEFAULT_PAGE_SIZE;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteQuery {
    pub keyword: Option<String>,
    pub folder_id: Option<String>,
    pub root_only: Option<bool>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

impl NoteQuery {
    pub fn get_page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn get_page_size(&self) -> u32 {
        self.page_size.unwrap_or(DEFAULT_PAGE_SIZE).max(1)
    }

    pub fn get_offset(&self) -> u32 {
        (self.get_page() - 1) * self.get_page_size()
    }

    pub fn get_keyword(&self) -> Option<String> {
        self.keyword
            .as_ref()
            .map(|keyword| keyword.trim().to_string())
            .filter(|keyword| !keyword.is_empty())
    }

    pub fn get_folder_id(&self) -> Option<String> {
        self.folder_id
            .as_ref()
            .map(|folder_id| folder_id.trim().to_string())
            .filter(|folder_id| !folder_id.is_empty())
    }

    pub fn is_root_only(&self) -> bool {
        self.root_only.unwrap_or(false)
    }
}
