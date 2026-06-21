use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WindowEvent};

use crate::services::window_service;

const MAIN_WINDOW_LABEL: &str = "main";
const TRAY_ID: &str = "main-tray";
const TRAY_TOGGLE_MAIN_ID: &str = "toggle_main_window";
const TRAY_TOGGLE_SEARCH_ID: &str = "toggle_search_window";
const TRAY_OPEN_SETTINGS_ID: &str = "open_settings_window";
const TRAY_QUIT_ID: &str = "quit_app";

fn create_tray_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, String> {
    let toggle_main_item = MenuItem::with_id(
        app,
        TRAY_TOGGLE_MAIN_ID,
        "显示 / 隐藏主窗口",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let toggle_search_item = MenuItem::with_id(
        app,
        TRAY_TOGGLE_SEARCH_ID,
        "打开 / 隐藏搜索",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let open_settings_item = MenuItem::with_id(
        app,
        TRAY_OPEN_SETTINGS_ID,
        "设置",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let quit_item = MenuItem::with_id(
        app,
        TRAY_QUIT_ID,
        "退出应用",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;

    Menu::with_items(
        app,
        &[
            &toggle_main_item,
            &toggle_search_item,
            &open_settings_item,
            &quit_item,
        ],
    )
    .map_err(|error| error.to_string())
}

fn handle_tray_menu_event(app: &AppHandle, id: &str) {
    match id {
        TRAY_TOGGLE_MAIN_ID => {
            if let Err(error) = window_service::toggle_main_window(app) {
                eprintln!("failed to toggle main window from tray: {}", error);
            }
        }
        TRAY_TOGGLE_SEARCH_ID => {
            if let Err(error) = window_service::toggle_search_window(app) {
                eprintln!("failed to toggle search window from tray: {}", error);
            }
        }
        TRAY_OPEN_SETTINGS_ID => {
            if let Err(error) = window_service::open_settings_window(app) {
                eprintln!("failed to open settings window from tray: {}", error);
            }
        }
        TRAY_QUIT_ID => {
            app.exit(0);
        }
        _ => {}
    }
}

fn initialize_main_window_close_handler(app: &AppHandle) -> Result<(), String> {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(());
    };

    window.on_window_event(|event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
        }
    });

    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "main window not found".to_string())?;

    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if let Err(error) = window.hide() {
                eprintln!("failed to hide main window: {}", error);
            }
        }
    });

    Ok(())
}

pub fn initialize_tray(app: &AppHandle) -> Result<(), String> {
    let menu = create_tray_menu(app)?;
    let icon = app
        .default_window_icon()
        .ok_or_else(|| "default window icon not found".to_string())?
        .clone();

    TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("creeper-notes")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            handle_tray_menu_event(app, event.id().as_ref());
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Err(error) = window_service::toggle_main_window(tray.app_handle()) {
                    eprintln!("failed to toggle main window from tray click: {}", error);
                }
            }
        })
        .build(app)
        .map_err(|error| error.to_string())?;

    initialize_main_window_close_handler(app)
}
