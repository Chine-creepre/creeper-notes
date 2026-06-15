use tauri::AppHandle;

use crate::services::{config_service, window_service};

#[cfg(windows)]
pub fn initialize_shortcuts(app: &AppHandle) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

    let app_config = config_service::get_config(app)?;
    let toggle_shortcut = app_config
        .toggle_shortcut
        .parse::<Shortcut>()
        .map_err(|error| error.to_string())?;
    let search_shortcut = app_config
        .search_shortcut
        .parse::<Shortcut>()
        .map_err(|error| error.to_string())?;
    let toggle_app_handle = app.clone();
    let search_app_handle = app.clone();

    app.global_shortcut()
        .on_shortcut(toggle_shortcut, move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                if let Err(error) = window_service::toggle_main_window(&toggle_app_handle) {
                    eprintln!("failed to toggle main window: {}", error);
                }
            }
        })
        .map_err(|error| error.to_string())?;

    app.global_shortcut()
        .on_shortcut(search_shortcut, move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                if let Err(error) = window_service::toggle_search_window(&search_app_handle) {
                    eprintln!("failed to toggle search window: {}", error);
                }
            }
        })
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[cfg(not(windows))]
pub fn initialize_shortcuts(_app: &AppHandle) -> Result<(), String> {
    Ok(())
}
