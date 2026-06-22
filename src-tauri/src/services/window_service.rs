use tauri::{AppHandle, Emitter, LogicalSize, Manager, Size, WebviewUrl, WebviewWindowBuilder};

const MAIN_WINDOW_LABEL: &str = "main";
const SEARCH_WINDOW_LABEL: &str = "search";
const SEARCH_WINDOW_URL: &str = "/search";
const SEARCH_WINDOW_FOCUS_EVENT: &str = "focus-search-input";
const SEARCH_WINDOW_WIDTH: f64 = 620.0;
const SEARCH_WINDOW_COLLAPSED_HEIGHT: f64 = 76.0;
const SEARCH_WINDOW_EXPANDED_HEIGHT: f64 = 420.0;
const SETTINGS_WINDOW_LABEL: &str = "settings";
const SETTINGS_WINDOW_URL: &str = "/settings";

fn focus_search_window_input(app: &AppHandle) -> Result<(), String> {
    app.emit_to(SEARCH_WINDOW_LABEL, SEARCH_WINDOW_FOCUS_EVENT, ())
        .map_err(|error| error.to_string())
}

fn hide_visible_window(app: &AppHandle, label: &str) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(label) {
        if window.is_visible().map_err(|error| error.to_string())? {
            window.hide().map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

fn set_search_window_height(app: &AppHandle, height: f64) -> Result<(), String> {
    let window = app
        .get_webview_window(SEARCH_WINDOW_LABEL)
        .ok_or_else(|| "search window not found".to_string())?;

    window
        .set_size(Size::Logical(LogicalSize {
            width: SEARCH_WINDOW_WIDTH,
            height,
        }))
        .map_err(|error| error.to_string())?;
    window.center().map_err(|error| error.to_string())
}

pub fn resize_search_window(app: &AppHandle, expanded: bool) -> Result<(), String> {
    set_search_window_height(
        app,
        if expanded {
            SEARCH_WINDOW_EXPANDED_HEIGHT
        } else {
            SEARCH_WINDOW_COLLAPSED_HEIGHT
        },
    )
}

pub fn open_search_window(app: &AppHandle) -> Result<(), String> {
    hide_visible_window(app, MAIN_WINDOW_LABEL)?;

    if let Some(window) = app.get_webview_window(SEARCH_WINDOW_LABEL) {
        resize_search_window(app, false)?;
        window.center().map_err(|error| error.to_string())?;
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        focus_search_window_input(app)?;

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
    .inner_size(SEARCH_WINDOW_WIDTH, SEARCH_WINDOW_COLLAPSED_HEIGHT)
    .center()
    .build()
    .map_err(|error| error.to_string())?;

    focus_search_window_input(app)?;

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
            hide_visible_window(app, MAIN_WINDOW_LABEL)?;
            resize_search_window(app, false)?;
            window.center().map_err(|error| error.to_string())?;
            window.show().map_err(|error| error.to_string())?;
            window.set_focus().map_err(|error| error.to_string())?;
            focus_search_window_input(app)?;
        }

        return Ok(());
    }

    open_search_window(app)
}

pub fn open_settings_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SETTINGS_WINDOW_LABEL) {
        window.center().map_err(|error| error.to_string())?;
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;

        return Ok(());
    }

    WebviewWindowBuilder::new(
        app,
        SETTINGS_WINDOW_LABEL,
        WebviewUrl::App(SETTINGS_WINDOW_URL.into()),
    )
    .title("Settings")
    .decorations(false)
    .transparent(false)
    .resizable(false)
    .inner_size(860.0, 500.0)
    .center()
    .build()
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn close_settings_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SETTINGS_WINDOW_LABEL) {
        window.close().map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn toggle_settings_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(SETTINGS_WINDOW_LABEL) {
        if window.is_visible().map_err(|error| error.to_string())? {
            window.close().map_err(|error| error.to_string())?;
        } else {
            window.center().map_err(|error| error.to_string())?;
            window.show().map_err(|error| error.to_string())?;
            window.set_focus().map_err(|error| error.to_string())?;
        }

        return Ok(());
    }

    open_settings_window(app)
}

pub fn is_settings_window_active(app: &AppHandle) -> bool {
    let Some(window) = app.get_webview_window(SETTINGS_WINDOW_LABEL) else {
        return false;
    };

    window.is_visible().unwrap_or(false)
}

pub fn show_main_window(app: &AppHandle) -> Result<(), String> {
    hide_visible_window(app, SEARCH_WINDOW_LABEL)?;

    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    window.center().map_err(|error| error.to_string())?;
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
        hide_visible_window(app, SEARCH_WINDOW_LABEL)?;
        window.center().map_err(|error| error.to_string())?;
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn toggle_main_window_fullscreen(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    let fullscreen = window.is_fullscreen().map_err(|error| error.to_string())?;

    window
        .set_fullscreen(!fullscreen)
        .map_err(|error| error.to_string())
}
