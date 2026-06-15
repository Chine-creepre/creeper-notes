use tauri::AppHandle;

use crate::services::{config_service, window_service};

#[cfg(windows)]
pub fn initialize_shortcuts(app: &AppHandle) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

    let app_config = config_service::get_config(app)?;
    let shortcut = app_config
        .search_shortcut
        .parse::<Shortcut>()
        .map_err(|error| error.to_string())?;
    let app_handle = app.clone();

    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                if let Err(error) = window_service::open_search_window(&app_handle) {
                    eprintln!("failed to open search window: {}", error);
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
