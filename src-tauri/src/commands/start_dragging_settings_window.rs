use tauri::Manager;

#[tauri::command]
pub fn start_dragging_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("settings")
        .ok_or_else(|| "settings window not found".to_string())?;

    window.start_dragging().map_err(|error| error.to_string())
}
