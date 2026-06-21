import { invoke } from "@tauri-apps/api/core";

export interface AppConfig {
  theme: string;
  toggle_shortcut: string;
  search_shortcut: string;
  data_path: string;
  auto_start_enabled: boolean;
}

export const getConfig = (): Promise<AppConfig> => invoke("get_config");

export const updateConfig = (appConfig: AppConfig): Promise<AppConfig> =>
  invoke("update_config", { appConfig });

export const resetConfig = (): Promise<AppConfig> => invoke("reset_config");

export const openSettingsWindow = (): Promise<void> => invoke("open_settings_window");

export const closeSettingsWindow = (): Promise<void> => invoke("close_settings_window");

export const startDraggingSettingsWindow = (): Promise<void> =>
  invoke("start_dragging_settings_window");
