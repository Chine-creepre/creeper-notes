use serde::{Deserialize, Serialize};

use crate::constants::note_constants::DEFAULT_PAGE_SIZE;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteQuery {
    pub keyword: Option<String>,
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
}
