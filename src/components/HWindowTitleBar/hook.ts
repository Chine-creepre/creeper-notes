import { invoke } from "@tauri-apps/api/core";

export const useHWindowTitleBar = () => {
  const startDragWindow = async (): Promise<void> => {
    await invoke("start_dragging_window");
  };

  const toggleFullscreen = async (): Promise<void> => {
    await invoke("toggle_main_window_fullscreen");
  };

  const closeToTray = async (): Promise<void> => {
    await invoke("hide_main_window");
  };

  return {
    closeToTray,
    startDragWindow,
    toggleFullscreen,
  };
};
