import type { AppSettings } from "./types";

export function resolveTheme(settings: AppSettings): "light" | "dark" {
  if (settings.theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return settings.theme;
}

export function applyThemeClass(el: HTMLElement, settings: AppSettings): void {
  el.classList.remove("theme-light", "theme-dark");
  el.classList.add(resolveTheme(settings) === "light" ? "theme-light" : "theme-dark");
}

export function watchSystemTheme(
  settings: AppSettings,
  el: HTMLElement,
  onChange: () => void,
): () => void {
  if (settings.theme !== "system") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    applyThemeClass(el, settings);
    onChange();
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
