import { invoke } from "@tauri-apps/api/core";

export const useHWindowTitleBar = () => {
  const startDragWindow = async (): Promise<void> => {
    await invoke("start_dragging_window");
  };

  return {
    startDragWindow,
  };
};
