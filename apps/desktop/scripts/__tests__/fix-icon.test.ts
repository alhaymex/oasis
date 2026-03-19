import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fixIcon, type FixIconDeps } from "../fix-icon.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BUILD = "/fake/build";
const PROJECT_ROOT = "/fake";

/**
 * Returns true when the path ends with one of the given segments
 * (matched by a trailing "/" + segment, or an exact match).
 */
function endsWithSegment(path: string, ...segments: string[]): boolean {
  return segments.some(
    (s) => path === s || path.endsWith("/" + s) || path.endsWith("\\" + s)
  );
}

/** Convenience builder for FixIconDeps */
function makeDeps(overrides: Partial<FixIconDeps> & { existsMap?: Record<string, boolean>; dirContents?: string[] } = {}): FixIconDeps {
  const { existsMap = {}, dirContents = [], ...rest } = overrides;

  const existsSync = (p: string): boolean => {
    for (const [key, val] of Object.entries(existsMap)) {
      if (p === key || p.endsWith("/" + key) || p.endsWith("\\" + key)) return val;
    }
    return false;
  };

  const readdirSync = (_p: string): string[] => dirContents;

  return {
    existsSync,
    readdirSync,
    spawnSync: () => ({ status: 0 }),
    buildFolder: BUILD,
    projectRoot: PROJECT_ROOT,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Console capture utility
// ---------------------------------------------------------------------------
interface CapturedConsole {
  logs: string[];
  warns: string[];
  errors: string[];
  restore: () => void;
}

function captureConsole(): CapturedConsole {
  const captured: CapturedConsole = { logs: [], warns: [], errors: [], restore: () => {} };
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args: unknown[]) => captured.logs.push(args.map(String).join(" "));
  console.warn = (...args: unknown[]) => captured.warns.push(args.map(String).join(" "));
  console.error = (...args: unknown[]) => captured.errors.push(args.map(String).join(" "));

  captured.restore = () => {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  };
  return captured;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("fixIcon()", () => {
  // -------------------------------------------------------------------------
  // 1. Build folder absent
  // -------------------------------------------------------------------------
  describe("when build folder does not exist", () => {
    it("logs a message and returns without processing any targets", async () => {
      const deps = makeDeps({ existsMap: {} }); // everything returns false
      const c = captureConsole();
      try {
        await fixIcon(deps);
      } finally {
        c.restore();
      }

      assert.ok(c.logs.some((m) => m.includes("Build folder does not exist yet.")));
      assert.strictEqual(c.warns.length, 0);
      assert.strictEqual(c.errors.length, 0);
    });

    it("does not call readdirSync when build folder is absent", async () => {
      let readdirCalled = false;
      const deps = makeDeps({
        existsMap: {},
        readdirSync: () => { readdirCalled = true; return []; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }
      assert.strictEqual(readdirCalled, false);
    });

    it("does not call spawnSync when build folder is absent", async () => {
      let spawnCalled = false;
      const deps = makeDeps({
        existsMap: {},
        spawnSync: () => { spawnCalled = true; return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }
      assert.strictEqual(spawnCalled, false);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Build folder exists but neither target directory exists
  // -------------------------------------------------------------------------
  describe("when build folder exists but no target directories exist", () => {
    it("does not log any target-level messages", async () => {
      const deps = makeDeps({ existsMap: { build: true } });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(!c.logs.some((m) => m.includes("Checking target:")));
      assert.strictEqual(c.warns.length, 0);
      assert.strictEqual(c.errors.length, 0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Target exists but .ico icon file is missing
  // -------------------------------------------------------------------------
  describe("when target dir exists but the .ico icon is missing", () => {
    it("warns about missing icon and skips that target", async () => {
      const deps = makeDeps({
        existsMap: { build: true, "dev-win-x64": true },
        dirContents: [],
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(c.logs.some((m) => m.includes("Checking target: dev-win-x64")));
      assert.ok(c.warns.some((m) => m.includes("Icon not found:") && m.includes("temp-launcher-icon.ico")));
      assert.strictEqual(c.errors.length, 0);
    });

    it("does not call readdirSync when icon is missing", async () => {
      let readdirCalled = false;
      const deps = makeDeps({
        existsMap: { build: true, "dev-win-x64": true },
        readdirSync: () => { readdirCalled = true; return []; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }
      assert.strictEqual(readdirCalled, false);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Icon exists but no Oasis* directory is present
  // -------------------------------------------------------------------------
  describe("when icon exists but no Oasis* app directory is found", () => {
    it("does not call spawnSync", async () => {
      let spawnCalled = false;
      const deps = makeDeps({
        existsMap: { build: true, "dev-win-x64": true, "temp-launcher-icon.ico": true },
        dirContents: ["SomeApp", "logs"],
        spawnSync: () => { spawnCalled = true; return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }
      assert.strictEqual(spawnCalled, false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Oasis dir found but bin/ subdirectory missing
  // -------------------------------------------------------------------------
  describe("when Oasis app dir exists but bin/ is missing", () => {
    it("skips without attempting icon embedding", async () => {
      let spawnCalled = false;
      const deps = makeDeps({
        existsMap: {
          build: true,
          "dev-win-x64": true,
          "temp-launcher-icon.ico": true,
          // bin is NOT present
        },
        dirContents: ["Oasis-1.0.0"],
        spawnSync: () => { spawnCalled = true; return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }
      assert.strictEqual(spawnCalled, false);
    });
  });

  // -------------------------------------------------------------------------
  // 6. bin/ exists but no recognised executables are present
  // -------------------------------------------------------------------------
  describe("when bin dir exists but no known executables are present", () => {
    it("does not call spawnSync", async () => {
      let spawnCalled = false;
      const deps = makeDeps({
        existsMap: {
          build: true,
          "dev-win-x64": true,
          "temp-launcher-icon.ico": true,
          bin: true,
          // no executables
        },
        dirContents: ["Oasis-1.0.0"],
        spawnSync: () => { spawnCalled = true; return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }
      assert.strictEqual(spawnCalled, false);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Executable found but rcedit binary is missing
  // -------------------------------------------------------------------------
  describe("when an executable is found but rcedit binary is missing", () => {
    it("logs an error about rcedit not found and does not call spawnSync", async () => {
      let spawnCalled = false;
      const deps = makeDeps({
        existsMap: {
          build: true,
          "dev-win-x64": true,
          "temp-launcher-icon.ico": true,
          bin: true,
          "launcher.exe": true,
          // rcedit-x64.exe NOT present
        },
        dirContents: ["Oasis-1.0.0"],
        spawnSync: () => { spawnCalled = true; return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(c.errors.some((m) => m.includes("rcedit not found at:") && m.includes("rcedit-x64.exe")));
      assert.strictEqual(spawnCalled, false);
    });
  });

  // -------------------------------------------------------------------------
  // 8. Happy path – rcedit exits with status 0
  // -------------------------------------------------------------------------
  describe("happy path – rcedit exits with status 0", () => {
    const happyExistsMap = {
      build: true,
      "dev-win-x64": true,
      "temp-launcher-icon.ico": true,
      bin: true,
      "launcher.exe": true,
      "rcedit-x64.exe": true,
    };

    it("calls spawnSync with rcedit cmd, exe path, --set-icon and icon path", async () => {
      const calls: Array<[string, string[], { stdio: string }]> = [];
      const deps = makeDeps({
        existsMap: happyExistsMap,
        dirContents: ["Oasis-1.0.0"],
        spawnSync: (cmd, args, opts) => { calls.push([cmd, args, opts]); return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.strictEqual(calls.length, 1);
      const [cmd, args] = calls[0];
      assert.ok(cmd.includes("rcedit-x64.exe"), `rcedit-x64.exe not in cmd: ${cmd}`);
      assert.ok(args[0].includes("launcher.exe"), `launcher.exe not in arg[0]: ${args[0]}`);
      assert.strictEqual(args[1], "--set-icon");
      assert.ok(args[2].includes("temp-launcher-icon.ico"), `ico not in arg[2]: ${args[2]}`);
    });

    it("passes stdio: 'inherit' to spawnSync", async () => {
      const calls: Array<[string, string[], { stdio: string }]> = [];
      const deps = makeDeps({
        existsMap: happyExistsMap,
        dirContents: ["Oasis-1.0.0"],
        spawnSync: (cmd, args, opts) => { calls.push([cmd, args, opts]); return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.strictEqual(calls[0][2].stdio, "inherit");
    });

    it("logs a success message naming the executable", async () => {
      const deps = makeDeps({
        existsMap: happyExistsMap,
        dirContents: ["Oasis-1.0.0"],
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(c.logs.some((m) => m.includes("Successfully embedded icon into launcher.exe")));
    });

    it("does not log any error messages on success", async () => {
      const deps = makeDeps({
        existsMap: happyExistsMap,
        dirContents: ["Oasis-1.0.0"],
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }
      assert.strictEqual(c.errors.length, 0);
    });
  });

  // -------------------------------------------------------------------------
  // 9. rcedit exits with non-zero status
  // -------------------------------------------------------------------------
  describe("when rcedit exits with non-zero status", () => {
    const existsMap = {
      build: true,
      "dev-win-x64": true,
      "temp-launcher-icon.ico": true,
      bin: true,
      "launcher.exe": true,
      "rcedit-x64.exe": true,
    };

    it("logs a failure message for the executable (status = 1)", async () => {
      const deps = makeDeps({
        existsMap,
        dirContents: ["Oasis-1.0.0"],
        spawnSync: () => ({ status: 1 }),
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(c.errors.some((m) => m.includes("Failed to embed icon into launcher.exe")));
      assert.ok(!c.logs.some((m) => m.includes("Successfully embedded icon")));
    });

    it("logs a failure message for any non-zero status (status = 2)", async () => {
      const deps = makeDeps({
        existsMap: { ...existsMap, "launcher.exe": false, bun: true },
        dirContents: ["Oasis-1.0.0"],
        spawnSync: () => ({ status: 2 }),
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(c.errors.some((m) => m.includes("Failed to embed icon into bun")));
    });
  });

  // -------------------------------------------------------------------------
  // 10. null status from spawnSync (process failed to launch)
  // -------------------------------------------------------------------------
  describe("when spawnSync returns null status", () => {
    it("treats null as failure and logs an error", async () => {
      const deps = makeDeps({
        existsMap: {
          build: true,
          "dev-win-x64": true,
          "temp-launcher-icon.ico": true,
          bin: true,
          "launcher.exe": true,
          "rcedit-x64.exe": true,
        },
        dirContents: ["Oasis-1.0.0"],
        spawnSync: () => ({ status: null }),
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(c.errors.some((m) => m.includes("Failed to embed icon into launcher.exe")));
    });
  });

  // -------------------------------------------------------------------------
  // 11. Both targets processed
  // -------------------------------------------------------------------------
  describe("target iteration", () => {
    it("checks both dev-win-x64 and stable-win-x64", async () => {
      const deps = makeDeps({
        existsMap: {
          build: true,
          "dev-win-x64": true,
          "stable-win-x64": true,
          // icon missing for both → warnings
        },
        dirContents: [],
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      const all = [...c.logs, ...c.warns];
      assert.ok(all.some((m) => m.includes("dev-win-x64")));
      assert.ok(all.some((m) => m.includes("stable-win-x64")));
    });

    it("skips a target that is absent from disk", async () => {
      // Only dev-win-x64 is present; stable-win-x64 is not
      const deps = makeDeps({
        existsMap: { build: true, "dev-win-x64": true },
        dirContents: [],
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      const all = [...c.logs, ...c.warns, ...c.errors];
      assert.ok(!all.some((m) => m.includes("stable-win-x64")));
    });

    it("processes stable-win-x64 independently of dev-win-x64", async () => {
      const spawnCalls: string[][] = [];
      const deps: FixIconDeps = {
        buildFolder: BUILD,
        projectRoot: PROJECT_ROOT,
        existsSync: (p: string) => {
          // Only stable-win-x64 tree is fully set up
          if (endsWithSegment(p, "build")) return true;
          if (endsWithSegment(p, "dev-win-x64")) return false;
          if (endsWithSegment(p, "stable-win-x64")) return true;
          if (endsWithSegment(p, "temp-launcher-icon.ico")) return true;
          if (endsWithSegment(p, "bin")) return true;
          if (endsWithSegment(p, "launcher.exe")) return true;
          if (endsWithSegment(p, "rcedit-x64.exe")) return true;
          return false;
        },
        readdirSync: () => ["Oasis-1.0.0"],
        spawnSync: (_cmd, args) => { spawnCalls.push(args); return { status: 0 }; },
      };
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.strictEqual(spawnCalls.length, 1);
    });
  });

  // -------------------------------------------------------------------------
  // 12. Directory filtering – only Oasis* dirs
  // -------------------------------------------------------------------------
  describe("Oasis directory filtering", () => {
    it("ignores directories that do not start with 'Oasis'", async () => {
      const checkedBinPaths: string[] = [];
      const deps: FixIconDeps = {
        buildFolder: BUILD,
        projectRoot: PROJECT_ROOT,
        existsSync: (p: string) => {
          if (endsWithSegment(p, "build")) return true;
          if (endsWithSegment(p, "dev-win-x64")) return true;
          if (endsWithSegment(p, "temp-launcher-icon.ico")) return true;
          if (p.includes("/bin") || p.includes("\\bin")) checkedBinPaths.push(p);
          return false;
        },
        readdirSync: () => ["ChromeApp", "Firefox", "OasisApp", "SomeOtherApp"],
        spawnSync: () => ({ status: 0 }),
      };
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      // Only OasisApp/bin should have been checked
      assert.ok(checkedBinPaths.every((p) => p.includes("OasisApp")));
      assert.ok(!checkedBinPaths.some((p) => p.includes("ChromeApp")));
      assert.ok(!checkedBinPaths.some((p) => p.includes("Firefox")));
      assert.ok(!checkedBinPaths.some((p) => p.includes("SomeOtherApp")));
    });

    it("processes multiple Oasis* directories in sequence", async () => {
      const spawnCalls: number = await (async () => {
        let count = 0;
        const deps = makeDeps({
          existsMap: {
            build: true,
            "dev-win-x64": true,
            "temp-launcher-icon.ico": true,
            bin: true,
            "launcher.exe": true,
            "rcedit-x64.exe": true,
          },
          dirContents: ["Oasis-1.0.0", "Oasis-2.0.0"],
          spawnSync: () => { count++; return { status: 0 }; },
        });
        const c = captureConsole();
        try { await fixIcon(deps); } finally { c.restore(); }
        return count;
      })();

      assert.strictEqual(spawnCalls, 2);
    });
  });

  // -------------------------------------------------------------------------
  // 13. All four recognised executables are checked
  // -------------------------------------------------------------------------
  describe("executable enumeration", () => {
    it("attempts to embed icon into all four candidate executables when all exist", async () => {
      const embeddedPaths: string[] = [];
      const deps: FixIconDeps = {
        buildFolder: BUILD,
        projectRoot: PROJECT_ROOT,
        existsSync: (p: string) => {
          if (endsWithSegment(p, "build")) return true;
          if (endsWithSegment(p, "dev-win-x64")) return true;
          if (endsWithSegment(p, "temp-launcher-icon.ico")) return true;
          if (endsWithSegment(p, "bin")) return true;
          if (endsWithSegment(p, "rcedit-x64.exe")) return true;
          // All four executables present
          if (endsWithSegment(p, "launcher.exe")) return true;
          // "launcher" without .exe – must not also match launcher.exe
          if ((p.endsWith("/launcher") || p.endsWith("\\launcher")) && !p.endsWith(".exe")) return true;
          if (endsWithSegment(p, "bun.exe")) return true;
          if ((p.endsWith("/bun") || p.endsWith("\\bun")) && !p.endsWith(".exe")) return true;
          return false;
        },
        readdirSync: () => ["Oasis-1.0.0"],
        spawnSync: (_cmd, args) => { embeddedPaths.push(args[0]); return { status: 0 }; },
      };
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.strictEqual(embeddedPaths.length, 4);
      assert.ok(embeddedPaths.some((p) => p.endsWith("launcher.exe")));
      assert.ok(embeddedPaths.some((p) => (p.endsWith("/launcher") || p.endsWith("\\launcher")) && !p.endsWith(".exe")));
      assert.ok(embeddedPaths.some((p) => p.endsWith("bun.exe")));
      assert.ok(embeddedPaths.some((p) => (p.endsWith("/bun") || p.endsWith("\\bun")) && !p.endsWith(".exe")));
    });

    it("only embeds into executables that exist – skips missing ones", async () => {
      const embeddedPaths: string[] = [];
      const deps = makeDeps({
        existsMap: {
          build: true,
          "dev-win-x64": true,
          "temp-launcher-icon.ico": true,
          bin: true,
          "bun.exe": true, // only bun.exe is present
          "rcedit-x64.exe": true,
        },
        dirContents: ["Oasis-1.0.0"],
        spawnSync: (_cmd, args) => { embeddedPaths.push(args[0]); return { status: 0 }; },
      });
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.strictEqual(embeddedPaths.length, 1);
      assert.ok(embeddedPaths[0].endsWith("bun.exe"));
    });
  });

  // -------------------------------------------------------------------------
  // 14. rcedit path uses node_modules/rcedit/bin/rcedit-x64.exe under projectRoot
  // -------------------------------------------------------------------------
  describe("rcedit path construction", () => {
    it("constructs rcedit path relative to project root", async () => {
      const rcEditPaths: string[] = [];
      const deps: FixIconDeps = {
        buildFolder: BUILD,
        projectRoot: PROJECT_ROOT,
        existsSync: (p: string) => {
          // Intercept the rcedit path check
          if (p.includes("rcedit")) { rcEditPaths.push(p); return true; }
          if (endsWithSegment(p, "build")) return true;
          if (endsWithSegment(p, "dev-win-x64")) return true;
          if (endsWithSegment(p, "temp-launcher-icon.ico")) return true;
          if (endsWithSegment(p, "bin")) return true;
          if (endsWithSegment(p, "launcher.exe")) return true;
          return false;
        },
        readdirSync: () => ["Oasis-1.0.0"],
        spawnSync: () => ({ status: 0 }),
      };
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.ok(rcEditPaths.length > 0);
      const rceditPath = rcEditPaths[0];
      assert.ok(rceditPath.startsWith(PROJECT_ROOT), `Expected path to start with ${PROJECT_ROOT}, got: ${rceditPath}`);
      assert.ok(rceditPath.includes("node_modules"));
      assert.ok(rceditPath.includes("rcedit-x64.exe"));
    });

    it("passes the rcedit path as the spawnSync command", async () => {
      const commands: string[] = [];
      const FAKE_ROOT = "/test-root";
      const FAKE_BUILD = "/test-root/build";
      const deps: FixIconDeps = {
        buildFolder: FAKE_BUILD,
        projectRoot: FAKE_ROOT,
        existsSync: (p: string) => {
          if (endsWithSegment(p, "build")) return true;
          if (endsWithSegment(p, "dev-win-x64")) return true;
          if (endsWithSegment(p, "temp-launcher-icon.ico")) return true;
          if (endsWithSegment(p, "bin")) return true;
          if (endsWithSegment(p, "launcher.exe")) return true;
          if (endsWithSegment(p, "rcedit-x64.exe")) return true;
          return false;
        },
        readdirSync: () => ["Oasis-1.0.0"],
        spawnSync: (cmd) => { commands.push(cmd); return { status: 0 }; },
      };
      const c = captureConsole();
      try { await fixIcon(deps); } finally { c.restore(); }

      assert.strictEqual(commands.length, 1);
      assert.ok(commands[0].startsWith(FAKE_ROOT));
      assert.ok(commands[0].includes(join("node_modules", "rcedit", "bin", "rcedit-x64.exe")));
    });
  });
});