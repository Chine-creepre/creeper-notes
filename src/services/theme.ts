import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getConfig, type AppConfig } from "@/request/apis/config";

export const APP_THEMES = ["blue_cyan", "green_jade", "red_brown", "brown", "yellow"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

interface AppThemeOption {
  label: string;
  value: AppTheme;
  preview: string;
}

export const DEFAULT_APP_THEME: AppTheme = "blue_cyan";
export const APP_CONFIG_CHANGED_EVENT = "app-config-changed";

export const APP_THEME_OPTIONS: AppThemeOption[] = [
  {
    label: "蓝青主题",
    value: "blue_cyan",
    preview: "linear-gradient(135deg, #2563eb, #06b6d4)",
  },
  {
    label: "绿玉主题",
    value: "green_jade",
    preview: "linear-gradient(135deg, #059669, #14b8a6)",
  },
  {
    label: "红棕主题",
    value: "red_brown",
    preview: "linear-gradient(135deg, #b91c1c, #92400e)",
  },
  {
    label: "木棕主题",
    value: "brown",
    preview: "linear-gradient(135deg, #7c4a2d, #b08968)",
  },
  {
    label: "金黄主题",
    value: "yellow",
    preview: "linear-gradient(135deg, #ca8a04, #facc15)",
  },
];

export const isAppTheme = (theme: string): theme is AppTheme =>
  (APP_THEMES as readonly string[]).includes(theme);

export const applyTheme = (theme: string) => {
  const appTheme = isAppTheme(theme) ? theme : DEFAULT_APP_THEME;

  document.documentElement.dataset.theme = appTheme;
};

export const applyAppConfig = (appConfig: AppConfig) => {
  applyTheme(appConfig.theme);
};

export const initializeTheme = async () => {
  const appConfig: AppConfig = await getConfig();

  applyAppConfig(appConfig);
};

export const listenAppConfigChanged = async (): Promise<UnlistenFn> =>
  listen<AppConfig>(APP_CONFIG_CHANGED_EVENT, (event) => {
    applyAppConfig(event.payload);
  });
