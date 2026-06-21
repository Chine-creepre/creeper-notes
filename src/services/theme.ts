import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getConfig, type AppConfig } from "@/request/apis/config";

export type AppTheme = "blue_cyan" | "green_jade" | "red_brown";

export const DEFAULT_APP_THEME: AppTheme = "blue_cyan";
export const APP_CONFIG_CHANGED_EVENT = "app-config-changed";

export const APP_THEME_OPTIONS: Array<{
  label: string;
  value: AppTheme;
}> = [
  {
    label: "蓝青主题",
    value: "blue_cyan",
  },
  {
    label: "绿玉主题",
    value: "green_jade",
  },
  {
    label: "红棕主题",
    value: "red_brown",
  },
];

export const isAppTheme = (theme: string): theme is AppTheme =>
  theme === "blue_cyan" || theme === "green_jade" || theme === "red_brown";

export const applyTheme = (theme: string): void => {
  const appTheme = isAppTheme(theme) ? theme : DEFAULT_APP_THEME;

  document.documentElement.dataset.theme = appTheme;
};

export const applyAppConfig = (appConfig: AppConfig): void => {
  applyTheme(appConfig.theme);
};

export const initializeTheme = async (): Promise<void> => {
  const appConfig: AppConfig = await getConfig();

  applyAppConfig(appConfig);
};

export const listenAppConfigChanged = async (): Promise<UnlistenFn> =>
  listen<AppConfig>(APP_CONFIG_CHANGED_EVENT, (event) => {
    applyAppConfig(event.payload);
  });
