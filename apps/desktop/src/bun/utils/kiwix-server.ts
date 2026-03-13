import { getBinPath } from "./paths";

const KIWIX_PORT = 9999;

const isWindows = process.platform === "win32";
const kiwixBinary = isWindows ? "kiwix-serve-win.exe" : `kiwix-serve-${process.platform}`;
const kiwixPath = getBinPath(kiwixBinary);

/**
 * Manages the kiwix-serve process lifecycle.
 *
 * Runs in library mode (--library --monitorLibrary) so that
 * changes to library.xml are picked up automatically.
 */
export class KiwixServer {
  private process: ReturnType<typeof Bun.spawn> | undefined;
  private port: number;
  private url: string;

  constructor(port: number = KIWIX_PORT) {
    this.port = port;
    this.url = `http://127.0.0.1:${port}`;
  }

  /**
   * Starts kiwix-serve in library mode.
   * The server watches the library XML file for changes and
   * automatically reloads when new ZIM files are added/removed.
   */
  start(libraryXmlPath: string): void {
    console.log(`Starting kiwix server on port ${this.port} with library: ${libraryXmlPath}`);

    this.process = Bun.spawn(
      [kiwixPath, "--library", "--monitorLibrary", "--port", this.port.toString(), libraryXmlPath],
      {
        stdout: "inherit",
        stderr: "inherit",
        onExit: (_proc, exitCode) => {
          console.log(`kiwix-serve exited with code ${exitCode}`);
          this.process = undefined;
        },
      }
    );
  }

  async waitForReady(retries = 20): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        await fetch(this.url, { method: "HEAD" });
        return true;
      } catch {
        await Bun.sleep(100);
      }
    }
    return false;
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
  }

  isRunning(): boolean {
    return this.process !== undefined;
  }

  getUrl(): string {
    return this.url;
  }
}
