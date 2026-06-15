use tauri::Manager;

#[tauri::command]
pub fn start_dragging_search_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("search")
        .ok_or_else(|| "search window not found".to_string())?;

    window.start_dragging().map_err(|error| error.to_string())
}
