import { getConfig, type AppConfig } from "@/request/apis/config";

export type AppTheme = "system" | "light" | "dark";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

const isAppTheme = (theme: string): theme is AppTheme =>
  theme === "system" || theme === "light" || theme === "dark";

const getResolvedTheme = (theme: AppTheme): "light" | "dark" => {
  if (theme !== "system") return theme;

  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
};

export const applyTheme = (theme: string): void => {
  const appTheme = isAppTheme(theme) ? theme : "system";
  const resolvedTheme = getResolvedTheme(appTheme);

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themeMode = appTheme;
};

export const initializeTheme = async (): Promise<void> => {
  const appConfig: AppConfig = await getConfig();

  applyTheme(appConfig.theme);
};

window.matchMedia(SYSTEM_DARK_QUERY).addEventListener("change", () => {
  const themeMode = document.documentElement.dataset.themeMode;

  if (themeMode === "system") {
    applyTheme("system");
  }
});
