import { BrowserWindow, Updater } from "electrobun/bun";
import { installEngine, isEngineInstalled } from "./utils/engine-manager";
import { rpc } from "./rpc";
import { ConfigManager } from "./utils/config-manager";
import { KiwixServer } from "./utils/kiwix-server";
import { ZimManager } from "./utils/zim-manager";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

const configManager = new ConfigManager();
const kiwixServer = new KiwixServer();

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.");
    }
  }
  return "views://mainview/index.html";
}

async function start() {
  await configManager.init();

  const url = await getMainViewUrl();

  const hasEngine = await isEngineInstalled();

  if (!hasEngine) {
    const splashWin = new BrowserWindow({
      title: "Oasis Setup",
      url: "data:text/html,<h1>Downloading Core Engine... Please wait a minute.</h1>",
      frame: { width: 400, height: 200, x: 400, y: 300 },
    });

    try {
      await installEngine(console.log);
    } catch (err) {
      console.error("Failed to download engine:", err);
      process.exit(1);
    }

    splashWin.close();
  }

  const config = configManager.getConfig();
  const zimManager = new ZimManager(config.libraryPath);

  // Sync existing ZIM files into library.xml
  zimManager.initLibraryXml();

  // Always start kiwix-serve in library mode — it monitors for changes
  kiwixServer.start(zimManager.getLibraryXmlPath());

  const isOnline = await kiwixServer.waitForReady();
  if (!isOnline) {
    console.error("🚨 Failed to connect to kiwix-serve.");
    kiwixServer.stop();
    process.exit(1);
  }

  const mainWindow = new BrowserWindow({
    title: "Oasis",
    url,
    rpc,
    frame: {
      width: 900,
      height: 700,
      x: 200,
      y: 200,
    },
  });
}

start().catch(console.error);

