mod commands;
mod constants;
mod models;
mod repositories;
mod services;

use commands::{
    create_note,
    delete_note,
    find_note_by_id,
    get_data_path,
    list_notes,
    search_notes,
    start_dragging_window,
    update_note,
};
use services::database_service;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            database_service::initialize_database(app.handle())
                .map_err(Box::<dyn std::error::Error>::from)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_dragging_window,
            get_data_path,
            create_note,
            find_note_by_id,
            list_notes,
            search_notes,
            update_note,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
