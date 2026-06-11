mod commands;
mod models;
mod repositories;
mod services;

use commands::{get_data_path, start_dragging_window};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            start_dragging_window,
            get_data_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
