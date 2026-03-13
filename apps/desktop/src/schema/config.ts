import { z } from "zod";
import { join } from "path";
import os from "os";

export const ThemeColorsSchema = z.object({
  bg: z.string(),
  surface: z.string(),
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  muted: z.string(),
  border: z.string(),
});

export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string(),
  dark: z.boolean(),
  colors: ThemeColorsSchema,
});

export const ThemeConfigSchema = z.object({
  version: z.number(),
  active: z.string(),
  themes: z.array(ThemeSchema),
});

export const AppConfigSchema = z.object({
  version: z.number().default(1),
  libraryPath: z.string().default(join(os.homedir(), "oasis-library")),
  language: z.string().default("en"),
  autoUpdate: z.boolean().default(true),
  launchAtStartup: z.boolean().default(false),
  zoomLevel: z.number().min(0.5).max(3).default(1),
  theme: ThemeConfigSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;