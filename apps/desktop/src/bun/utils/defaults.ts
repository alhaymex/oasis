import { AppConfig, AppConfigSchema, ThemeConfig } from "../../schema/config";

export const DEFAULT_THEME: ThemeConfig = {
  version: 1,
  active: "oasis",
  themes: [
    {
      id: "oasis",
      name: "Oasis",
      description: "Oasis default theme",
      author: "Oasis",
      dark: false,
      colors: {
        bg: "#0D1F2D",
        surface: "#1A3A4A",
        primary: "#4ABDE8",
        secondary: "#4CAF7D",
        accent: "#E8D5A3",
        muted: "#7AAAC4",
        border: "#1A6B8A",
      },
    },
    {
      id: "oasis-dark",
      name: "Oasis Dark",
      description: "Oasis but darker",
      author: "Oasis",
      dark: true,
      colors: {
        bg: "#07131C",
        surface: "#0D2535",
        primary: "#1A8FBF",
        secondary: "#2E8B57",
        accent: "#C4A35A",
        muted: "#4A7A94",
        border: "#0D4A63",
      },
    },
  ],
};

export const DEFAULT_CONFIG: AppConfig = AppConfigSchema.parse({
  version: 1,
  theme: DEFAULT_THEME,
});
