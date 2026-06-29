mod commands;
mod constants;
mod models;
mod repositories;
mod services;

use commands::{
    close_search_window,
    close_settings_window,
    create_folder,
    create_note,
    delete_folder,
    delete_note,
    find_folder_by_id,
    find_note_by_id,
    get_config,
    get_data_path,
    hide_main_window,
    list_folder_tree,
    list_folders,
    list_notes,
    move_note_to_folder,
    open_search_window,
    open_settings_window,
    reset_config,
    resize_search_window,
    search_notes,
    show_main_window,
    start_dragging_search_window,
    start_dragging_settings_window,
    start_dragging_window,
    toggle_main_window,
    toggle_main_window_fullscreen,
    toggle_search_window,
    toggle_settings_window,
    update_config,
    update_folder,
    update_note,
};
use services::{
    auto_start_service,
    config_service,
    database_service,
    shortcut_service,
    tray_service,
    window_service,
};

const ENABLE_AUTO_START_ARG: &str = "--enable-auto-start";
const START_IN_TRAY_ARG: &str = "--start-in-tray";

fn has_arg(target_arg: &str) -> bool {
    std::env::args().any(|arg| arg == target_arg)
}

fn should_enable_auto_start() -> bool {
    has_arg(ENABLE_AUTO_START_ARG)
}

fn should_start_in_tray() -> bool {
    has_arg(START_IN_TRAY_ARG)
}

fn handle_enable_auto_start_command() {
    if !should_enable_auto_start() {
        return;
    }

    if let Err(error) = auto_start_service::enable_auto_start_for_current_exe() {
        eprintln!("failed to enable auto start: {}", error);
        std::process::exit(1);
    }

    std::process::exit(0);
}

fn hide_main_window_for_tray_start(app: &tauri::AppHandle) {
    if let Err(error) = window_service::hide_main_window(app) {
        eprintln!("failed to hide main window for tray start: {}", error);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    handle_enable_auto_start_command();

    let start_in_tray = should_start_in_tray();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(move |app| {
            database_service::initialize_database(app.handle())
                .map_err(Box::<dyn std::error::Error>::from)?;

            let app_config = config_service::initialize_config(app.handle())
                .map_err(Box::<dyn std::error::Error>::from)?;

            shortcut_service::initialize_shortcuts(app.handle())
                .map_err(Box::<dyn std::error::Error>::from)?;

            tray_service::initialize_tray(app.handle(), &app_config)
                .map_err(Box::<dyn std::error::Error>::from)?;

            if start_in_tray {
                hide_main_window_for_tray_start(app.handle());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_dragging_window,
            start_dragging_search_window,
            start_dragging_settings_window,
            get_data_path,
            get_config,
            update_config,
            reset_config,
            open_search_window,
            close_search_window,
            toggle_search_window,
            resize_search_window,
            open_settings_window,
            close_settings_window,
            toggle_settings_window,
            show_main_window,
            hide_main_window,
            toggle_main_window,
            toggle_main_window_fullscreen,
            create_folder,
            find_folder_by_id,
            list_folders,
            list_folder_tree,
            update_folder,
            delete_folder,
            create_note,
            find_note_by_id,
            list_notes,
            search_notes,
            update_note,
            move_note_to_folder,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
