use tauri::AppHandle;

const AUTO_START_REGISTRY_KEY_PATH: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const AUTO_START_REGISTRY_VALUE_NAME: &str = "creeper-notes";
const START_IN_TRAY_ARG: &str = "--start-in-tray";
const STARTUP_SHORTCUT_FILE_NAME: &str = "creeper-notes.lnk";

#[cfg(windows)]
fn get_app_exe_path() -> Result<String, String> {
    let exe_path = std::env::current_exe()
        .map_err(|error| error.to_string())?;

    Ok(exe_path.to_string_lossy().to_string())
}

#[cfg(windows)]
fn get_auto_start_command() -> Result<String, String> {
    Ok(format!("\"{}\" {}", get_app_exe_path()?, START_IN_TRAY_ARG))
}

#[cfg(windows)]
fn get_startup_shortcut_path() -> Option<std::path::PathBuf> {
    std::env::var_os("APPDATA")
        .map(std::path::PathBuf::from)
        .map(|path| {
            path.join("Microsoft")
                .join("Windows")
                .join("Start Menu")
                .join("Programs")
                .join("Startup")
                .join(STARTUP_SHORTCUT_FILE_NAME)
        })
}

#[cfg(windows)]
fn get_registry_auto_start_value() -> Result<Option<String>, String> {
    use std::io::ErrorKind;

    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
    use winreg::RegKey;

    let current_user = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = match current_user.open_subkey_with_flags(AUTO_START_REGISTRY_KEY_PATH, KEY_READ) {
        Ok(run_key) => run_key,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };

    match run_key.get_value::<String, _>(AUTO_START_REGISTRY_VALUE_NAME) {
        Ok(value) => Ok(Some(value)),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg(windows)]
fn has_valid_registry_auto_start() -> Result<bool, String> {
    let Some(registry_value) = get_registry_auto_start_value()? else {
        return Ok(false);
    };
    let auto_start_command = get_auto_start_command()?;

    Ok(registry_value == auto_start_command)
}

#[cfg(windows)]
fn has_startup_shortcut() -> bool {
    get_startup_shortcut_path().is_some_and(|path| path.exists())
}

#[cfg(windows)]
fn remove_startup_shortcut() -> Result<(), String> {
    use std::io::ErrorKind;

    let Some(shortcut_path) = get_startup_shortcut_path() else {
        return Ok(());
    };

    match std::fs::remove_file(shortcut_path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg(windows)]
pub fn is_auto_start_enabled(_app: &AppHandle) -> Result<bool, String> {
    Ok(has_valid_registry_auto_start()? || has_startup_shortcut())
}

#[cfg(not(windows))]
pub fn is_auto_start_enabled(_app: &AppHandle) -> Result<bool, String> {
    Ok(false)
}

#[cfg(windows)]
pub fn enable_auto_start_for_current_exe() -> Result<(), String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let auto_start_command = get_auto_start_command()?;
    let current_user = RegKey::predef(HKEY_CURRENT_USER);
    let (run_key, _) = current_user
        .create_subkey(AUTO_START_REGISTRY_KEY_PATH)
        .map_err(|error| error.to_string())?;

    run_key
        .set_value(AUTO_START_REGISTRY_VALUE_NAME, &auto_start_command)
        .map_err(|error| error.to_string())?;

    let registry_value = get_registry_auto_start_value()?;

    if registry_value.as_deref() != Some(auto_start_command.as_str()) {
        return Err("auto start registry value mismatch".to_string());
    }

    remove_startup_shortcut()
}

#[cfg(not(windows))]
pub fn enable_auto_start_for_current_exe() -> Result<(), String> {
    Err("auto start is only supported on Windows now".to_string())
}

#[cfg(windows)]
pub fn enable_auto_start(_app: &AppHandle) -> Result<(), String> {
    enable_auto_start_for_current_exe()
}

#[cfg(not(windows))]
pub fn enable_auto_start(_app: &AppHandle) -> Result<(), String> {
    Err("auto start is only supported on Windows now".to_string())
}

#[cfg(windows)]
pub fn disable_auto_start(_app: &AppHandle) -> Result<(), String> {
    use std::io::ErrorKind;

    use winreg::enums::{HKEY_CURRENT_USER, KEY_SET_VALUE};
    use winreg::RegKey;

    let current_user = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = match current_user.open_subkey_with_flags(
        AUTO_START_REGISTRY_KEY_PATH,
        KEY_SET_VALUE,
    ) {
        Ok(run_key) => Some(run_key),
        Err(error) if error.kind() == ErrorKind::NotFound => None,
        Err(error) => return Err(error.to_string()),
    };

    if let Some(run_key) = run_key {
        match run_key.delete_value(AUTO_START_REGISTRY_VALUE_NAME) {
            Ok(()) => {}
            Err(error) if error.kind() == ErrorKind::NotFound => {}
            Err(error) => return Err(error.to_string()),
        }
    }

    remove_startup_shortcut()
}

#[cfg(not(windows))]
pub fn disable_auto_start(_app: &AppHandle) -> Result<(), String> {
    Err("auto start is only supported on Windows now".to_string())
}

pub fn sync_auto_start(app: &AppHandle, enabled: bool) -> Result<(), String> {
    if enabled {
        enable_auto_start(app)
    } else {
        disable_auto_start(app)
    }
}
