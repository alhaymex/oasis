import type { Theme } from "@/schema/config";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.style.setProperty("--color-bg", theme.colors.bg);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty("--color-accent", theme.colors.accent);
  root.style.setProperty("--color-muted", theme.colors.muted);
  root.style.setProperty("--color-border", theme.colors.border);

  root.classList.toggle("dark", theme.dark);
}
