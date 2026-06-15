use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub theme: String,
    pub toggle_shortcut: String,
    pub search_shortcut: String,
    pub data_path: String,
    pub auto_start_enabled: bool,
}
