import { invoke } from "@tauri-apps/api/core";

export const useHWindowTitleBar = () => {
  const startDragWindow = async (event: MouseEvent) => {
    if (event.detail > 1) return;

    await invoke("start_dragging_window");
  };

  const toggleFullscreen = async () => {
    await invoke("toggle_main_window_fullscreen");
  };

  const closeToTray = async () => {
    await invoke("hide_main_window");
  };

  return {
    closeToTray,
    startDragWindow,
    toggleFullscreen,
  };
};
