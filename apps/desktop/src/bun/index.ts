import { BrowserWindow, Updater } from "electrobun/bun";
import { readdirSync } from "fs";
import { installEngine, isEngineInstalled } from "./utils/engine-manager";
import { rpc } from "./rpc";
import { ConfigManager } from "./utils/config-manager";
import { getLibraryPath, getBinPath, ensureDir, pathExists, join } from "./utils/paths";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const KIWIX_PORT = 9999;
const KIWIX_URL = `http://127.0.0.1:${KIWIX_PORT}`;

const isWindows = process.platform === "win32";
const kiwixBinary = isWindows ? "kiwix-serve-win.exe" : `kiwix-serve-${process.platform}`;
const kiwixPath = getBinPath(kiwixBinary);

const configManager = new ConfigManager();

function getZimFiles(): string[] {
  const zimDir = getLibraryPath();
  if (!pathExists(zimDir)) {
    ensureDir(zimDir);
    return [];
  }
  return readdirSync(zimDir).filter((f) => f.endsWith(".zim"));
}

let kiwixProcess: ReturnType<typeof Bun.spawn> | undefined;

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

async function waitForServer(url: string, retries = 20): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await fetch(url, { method: "HEAD" });
      return true;
    } catch {
      await Bun.sleep(100);
    }
  }
  return false;
}

function startKiwixServer(zimFiles: string[]) {
  if (zimFiles.length === 0) {
    console.log("No ZIM files found. Skipping kiwix-serve.");
    return;
  }

  console.log(`Starting kiwix server on port ${KIWIX_PORT} with ${zimFiles.length} ZIM file(s)...`);

  const zimPaths = zimFiles.map((f) => join(getLibraryPath(), f));

  kiwixProcess = Bun.spawn([kiwixPath, "--port", KIWIX_PORT.toString(), ...zimPaths], {
    stdout: "inherit",
    stderr: "inherit",
    onExit(_proc, exitCode) {
      console.log(`kiwix-serve exited with code ${exitCode}`);
    },
  });
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

  const zimFiles = getZimFiles();
  startKiwixServer(zimFiles);

  if (zimFiles.length > 0) {
    const isOnline = await waitForServer(KIWIX_URL);
    if (!isOnline) {
      console.error("🚨 Failed to connect to kiwix-serve.");
      if (kiwixProcess) kiwixProcess.kill();
      process.exit(1);
    }
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
