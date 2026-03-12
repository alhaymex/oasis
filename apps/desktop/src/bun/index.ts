import { BrowserWindow, Updater } from 'electrobun/bun';
import { installEngine, isEngineInstalled } from './utils/engine-manager';

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === 'dev') {
    try {
      await fetch(DEV_SERVER_URL, { method: 'HEAD' });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.");
    }
  }
  return 'views://mainview/index.html';
}

async function start() {
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

  const mainWindow = new BrowserWindow({
    title: 'Oasis',
    url,
    frame: {
      width: 900,
      height: 700,
      x: 200,
      y: 200,
    },
  });
}

start().catch(console.error);
