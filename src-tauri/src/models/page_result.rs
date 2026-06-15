use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageResult<T> {
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
    pub items: Vec<T>,
}
