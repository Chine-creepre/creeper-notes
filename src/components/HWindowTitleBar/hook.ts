import { getCurrentWindow } from "@tauri-apps/api/window";

export const useHWindowTitleBar = () => {
  const appWindow = getCurrentWindow();

  const startDragWindow = async (): Promise<void> => {
    await appWindow.startDragging();
  };

  return {
    startDragWindow,
  };
};
