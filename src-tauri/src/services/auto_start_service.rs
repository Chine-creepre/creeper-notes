use tauri::AppHandle;

const AUTO_START_REGISTRY_KEY_PATH: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const AUTO_START_REGISTRY_VALUE_NAME: &str = "creeper-notes";

#[cfg(windows)]
fn get_app_exe_path() -> Result<String, String> {
    let exe_path = std::env::current_exe()
        .map_err(|error| error.to_string())?;

    Ok(exe_path.to_string_lossy().to_string())
}

#[cfg(windows)]
pub fn enable_auto_start(_app: &AppHandle) -> Result<(), String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let exe_path = get_app_exe_path()?;
    let current_user = RegKey::predef(HKEY_CURRENT_USER);
    let (run_key, _) = current_user
        .create_subkey(AUTO_START_REGISTRY_KEY_PATH)
        .map_err(|error| error.to_string())?;

    run_key
        .set_value(AUTO_START_REGISTRY_VALUE_NAME, &exe_path)
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[cfg(not(windows))]
pub fn enable_auto_start(_app: &AppHandle) -> Result<(), String> {
    Err("auto start is only supported on Windows now".to_string())
}

#[cfg(windows)]
pub fn disable_auto_start(_app: &AppHandle) -> Result<(), String> {
    use std::io::ErrorKind;

    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let current_user = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = current_user
        .open_subkey_with_flags(
            AUTO_START_REGISTRY_KEY_PATH,
            winreg::enums::KEY_SET_VALUE,
        )
        .map_err(|error| error.to_string())?;

    match run_key.delete_value(AUTO_START_REGISTRY_VALUE_NAME) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
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
