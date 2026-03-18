import type { ElectrobunConfig } from "electrobun";
import pkgJSON from "./package.json";

export default {
  app: {
    name: "Oasis",
    identifier: "oasis.syferpool.com",
    version: pkgJSON.version,
  },
  build: {
    copy: {
      "dist/index.html": "views/mainview/index.html",
      "dist/assets": "views/mainview/assets",
    },
    watchIgnore: ["dist/**"],
    mac: {
      bundleCEF: false,
      icons: "public/logo.png"
    },
    linux: {
      bundleCEF: true,
      defaultRenderer: "cef",
      bundleWGPU: true,
      icon: "public/logo.png"
    },
    win: {
      bundleCEF: false,
      icon: "public/logo.png"
    },

  },
} satisfies ElectrobunConfig;
