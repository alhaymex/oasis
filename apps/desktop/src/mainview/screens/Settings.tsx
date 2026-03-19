import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Folder, Palette, Sparkles } from "lucide-react";
import type { AppConfig } from "@/schema/config";
import { api } from "../lib/rpcClient";
import appPackage from "../../../package.json";

function Settings() {
  const [libraryPath, setLibraryPath] = useState("");
  const [activeThemeId, setActiveThemeId] = useState("");
  const latestVersion = appPackage.version;

  const {
    data: config,
    isLoading,
    error,
  } = useQuery<AppConfig>({
    queryKey: ["app-config"],
    queryFn: async () => {
      const res = await api.getConfig();
      if (!res) {
        throw new Error("Config not available");
      }
      return res;
    },
  });

  useEffect(() => {
    if (!config) return;
    setLibraryPath(config.libraryPath);
    setActiveThemeId(config.theme.active);
  }, [config]);

  const activeTheme = config?.theme.themes.find((theme) => theme.id === activeThemeId);
  const hasUpdate = latestVersion !== appPackage.version;

  return (
    <div className="flex-1 h-screen overflow-y-auto p-8">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-accent)]">Settings</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Configure where Oasis stores your library and preview the installed themes.
          </p>
        </div>

        <div className="grid gap-6">
          <section
            className="rounded-3xl border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--color-border)]/40 p-3 text-[var(--color-primary)]">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-accent)]">
                  Library directory
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Current storage location for downloaded content and metadata.
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-[var(--color-accent)]">
              Library path
            </label>
            <input
              type="text"
              value={libraryPath}
              onChange={(event) => setLibraryPath(event.target.value)}
              disabled={isLoading}
              placeholder="C:\\Users\\you\\oasis-library"
              className="mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-[var(--color-muted)]/70 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-accent)",
              }}
            />
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              This path mirrors the `libraryPath` value managed by the desktop config.
            </p>
          </section>

          <section
            className="rounded-3xl border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--color-border)]/40 p-3 text-[var(--color-primary)]">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-accent)]">Theme selector</h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Available themes come from the current desktop config.
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-[var(--color-accent)]">Theme</label>
            <select
              value={activeThemeId}
              onChange={(event) => setActiveThemeId(event.target.value)}
              disabled={isLoading || !config}
              className="mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-accent)",
              }}
            >
              {(config?.theme.themes ?? []).map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>

            {activeTheme && (
              <div
                className="mt-5 rounded-2xl border p-4"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-bg) 78%, transparent)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-[var(--color-accent)]">
                      {activeTheme.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {activeTheme.description}
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs text-[var(--color-muted)]">
                    {activeTheme.dark ? "Dark" : "Light"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {Object.entries(activeTheme.colors).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 rounded-full px-3 py-2">
                      <span
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: value, borderColor: "rgba(255,255,255,0.25)" }}
                      />
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                        {key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section
            className="rounded-3xl border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--color-border)]/40 p-3 text-[var(--color-secondary)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-accent)]">App version</h2>
                  <p className="text-sm text-[var(--color-muted)]">Installed desktop build.</p>
                </div>
              </div>

              {hasUpdate && (
                <button
                  type="button"
                  className="rounded-2xl border px-4 py-2 text-sm font-medium transition-all hover:brightness-110"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-bg)",
                  }}
                >
                  Update
                </button>
              )}
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Current
                </p>
                <p className="mt-1 text-2xl font-semibold text-[var(--color-accent)]">
                  v{appPackage.version}
                </p>
              </div>

              <p className="text-sm text-[var(--color-muted)]">
                {hasUpdate
                  ? `Latest available: v${latestVersion}`
                  : "You are on the latest version."}
              </p>
            </div>
          </section>
        </div>

        {error && <p className="text-sm text-red-400">Failed to load current settings.</p>}
      </div>
    </div>
  );
}

export default Settings;
