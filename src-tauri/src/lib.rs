mod commands;
mod constants;
mod models;
mod repositories;
mod services;

use commands::{
    close_search_window,
    create_note,
    delete_note,
    find_note_by_id,
    get_config,
    get_data_path,
    list_notes,
    open_search_window,
    search_notes,
    show_main_window,
    start_dragging_search_window,
    start_dragging_window,
    update_config,
    update_note,
};
use services::{config_service, database_service, shortcut_service};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            database_service::initialize_database(app.handle())
                .map_err(Box::<dyn std::error::Error>::from)?;

            config_service::initialize_config(app.handle())
                .map_err(Box::<dyn std::error::Error>::from)?;

            shortcut_service::initialize_shortcuts(app.handle())
                .map_err(Box::<dyn std::error::Error>::from)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_dragging_window,
            start_dragging_search_window,
            get_data_path,
            get_config,
            update_config,
            open_search_window,
            close_search_window,
            show_main_window,
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
