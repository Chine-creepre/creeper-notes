import { getCurrentWindow } from "@tauri-apps/api/window";

export const useHWindowTitleBar = () => {
  const appWindow = getCurrentWindow();

  const minimizeWindow = async (): Promise<void> => {
    await appWindow.minimize();
  };

  const toggleMaximizeWindow = async (): Promise<void> => {
    const isMaximized = await appWindow.isMaximized();

    if (isMaximized) {
      await appWindow.unmaximize();
      return;
    }

    await appWindow.maximize();
  };

  const closeWindow = async (): Promise<void> => {
    await appWindow.close();
  };

  return {
    minimizeWindow,
    toggleMaximizeWindow,
    closeWindow,
  };
};
