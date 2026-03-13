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
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
