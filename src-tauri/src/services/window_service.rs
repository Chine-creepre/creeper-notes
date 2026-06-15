use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const MAIN_WINDOW_LABEL: &str = "main";
const SEARCH_WINDOW_LABEL: &str = "search";
const SEARCH_WINDOW_URL: &str = "/search";

pub fn open_search_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SEARCH_WINDOW_LABEL) {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;

        return Ok(());
    }

    WebviewWindowBuilder::new(
        app,
        SEARCH_WINDOW_LABEL,
        WebviewUrl::App(SEARCH_WINDOW_URL.into()),
    )
    .title("Search")
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .resizable(false)
    .inner_size(640.0, 260.0)
    .center()
    .build()
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn close_search_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SEARCH_WINDOW_LABEL) {
        window.hide().map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn toggle_search_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SEARCH_WINDOW_LABEL) {
        if window.is_visible().map_err(|error| error.to_string())? {
            window.hide().map_err(|error| error.to_string())?;
        } else {
            window.show().map_err(|error| error.to_string())?;
            window.set_focus().map_err(|error| error.to_string())?;
        }

        return Ok(());
    }

    open_search_window(app)
}

pub fn show_main_window(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;

    Ok(())
}

pub fn hide_main_window(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    window.hide().map_err(|error| error.to_string())?;

    Ok(())
}

pub fn toggle_main_window(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    if window.is_visible().map_err(|error| error.to_string())? {
        window.hide().map_err(|error| error.to_string())?;
    } else {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }

    Ok(())
}
