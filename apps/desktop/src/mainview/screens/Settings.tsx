import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Folder, Palette, Sparkles } from "lucide-react";
import type { AppConfig } from "@/schema/config";
import { api } from "../lib/rpcClient";
import { useAppConfig } from "../hooks/useAppConfig";
import { useDownloadStore, useLibraryMigrationStore } from "../store";
import appPackage from "../../../package.json";

const migrationStageLabels = {
  idle: "Idle",
  validating: "Validating",
  stopping_services: "Stopping services",
  moving_files: "Moving files",
  updating_database: "Updating database",
  rewriting_library_xml: "Rebuilding library.xml",
  writing_config: "Saving config",
  restarting_services: "Restarting services",
  completed: "Completed",
  error: "Error",
} as const;

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function Settings() {
  const [libraryPath, setLibraryPath] = useState("");
  const latestVersion = appPackage.version;
  const queryClient = useQueryClient();
  const previousConfigLibraryPath = useRef<string | undefined>(undefined);

  const { data: config, isLoading, error } = useAppConfig();
  const downloads = useDownloadStore((state) => state.downloads);
  const migrationState = useLibraryMigrationStore((state) => state.state);
  const resetMigrationState = useLibraryMigrationStore((state) => state.resetState);
  const isMigrationRunning = migrationState.status === "running";
  const hasActiveDownloads = Object.values(downloads).some(
    (download) => download.status === "downloading"
  );

  useEffect(() => {
    if (!config) return;
    const nextLibraryPath = config.libraryPath;

    setLibraryPath((currentPath) => {
      const previousPath = previousConfigLibraryPath.current;
      previousConfigLibraryPath.current = nextLibraryPath;

      if (!currentPath) {
        return nextLibraryPath;
      }

      if (migrationState.status === "completed") {
        return nextLibraryPath;
      }

      if (previousPath === undefined || currentPath.trim() === previousPath.trim()) {
        return nextLibraryPath;
      }

      return currentPath;
    });
  }, [config?.libraryPath, migrationState.status]);

  const switchThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const res = await api.switchTheme(themeId);
      if (!res) {
        throw new Error("Theme update failed");
      }
      return res;
    },
    onMutate: async (themeId) => {
      await queryClient.cancelQueries({ queryKey: ["app-config"] });

      const previousConfig = queryClient.getQueryData<AppConfig>(["app-config"]);
      if (!previousConfig) {
        return { previousConfig };
      }

      queryClient.setQueryData<AppConfig>(["app-config"], {
        ...previousConfig,
        theme: {
          ...previousConfig.theme,
          active: themeId,
        },
      });

      return { previousConfig };
    },
    onError: (_error, _themeId, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(["app-config"], context.previousConfig);
      }
    },
    onSuccess: (nextConfig) => {
      queryClient.setQueryData(["app-config"], nextConfig);
    },
  });

  const startLibraryMigrationMutation = useMutation({
    mutationFn: async (nextPath: string) => {
      const res = await api.startLibraryMigration(nextPath);
      if (!res) {
        throw new Error("Failed to start library migration.");
      }
      return res;
    },
  });

  useEffect(() => {
    if (migrationState.status !== "completed") {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["app-config"] });
    queryClient.invalidateQueries({ queryKey: ["local-library"] });
  }, [migrationState.status, migrationState.currentPath, queryClient]);

  useEffect(() => {
    if (migrationState.status !== "completed") {
      return;
    }

    const timeout = setTimeout(() => {
      resetMigrationState();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [migrationState.status, resetMigrationState]);

  const activeThemeId = config?.theme.active ?? "";
  const activeTheme = config?.theme.themes.find((theme) => theme.id === activeThemeId);
  const hasUpdate = latestVersion !== appPackage.version;
  const hasLibraryChange = libraryPath.trim() !== (config?.libraryPath ?? "").trim();
  const migrationProgress =
    migrationState.totalBytes && migrationState.totalBytes > 0
      ? Math.min(
          100,
          Math.round(((migrationState.movedBytes ?? 0) / migrationState.totalBytes) * 100)
        )
      : undefined;
  const libraryMutationError =
    startLibraryMigrationMutation.error instanceof Error
      ? startLibraryMigrationMutation.error.message
      : null;

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
              onChange={(event) => {
                if (startLibraryMigrationMutation.isError) {
                  startLibraryMigrationMutation.reset();
                }
                setLibraryPath(event.target.value);
              }}
              disabled={isLoading || isMigrationRunning}
              placeholder="C:\\Users\\you\\oasis-library"
              className="mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-[var(--color-muted)]/70 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-accent)",
              }}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => startLibraryMigrationMutation.mutate(libraryPath)}
                disabled={
                  isLoading ||
                  isMigrationRunning ||
                  hasActiveDownloads ||
                  !libraryPath.trim() ||
                  !hasLibraryChange
                }
                className="rounded-2xl border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 hover:brightness-110"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-bg)",
                }}
              >
                {isMigrationRunning ? "Moving..." : "Change Directory"}
              </button>
              <p className="text-xs text-[var(--color-muted)]">
                The change only applies after you click the button.
              </p>
            </div>

            {hasActiveDownloads && (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Wait for active downloads to finish before changing the library path.
              </p>
            )}

            {(migrationState.status !== "idle" || libraryMutationError) && (
              <div
                className="mt-5 rounded-2xl border p-4"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-bg) 78%, transparent)",
                  borderColor:
                    migrationState.status === "error" || libraryMutationError
                      ? "rgba(248, 113, 113, 0.6)"
                      : "var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-accent)]">
                      {migrationStageLabels[libraryMutationError ? "error" : migrationState.stage]}
                    </p>
                    <p
                      className={`mt-1 text-sm ${
                        migrationState.status === "error" || libraryMutationError
                          ? "text-red-400"
                          : "text-[var(--color-muted)]"
                      }`}
                    >
                      {libraryMutationError ||
                        migrationState.error ||
                        migrationState.message ||
                        "Ready"}
                    </p>
                  </div>

                  {migrationProgress !== undefined && (
                    <p className="text-xs text-[var(--color-muted)]">{migrationProgress}%</p>
                  )}
                </div>

                {migrationProgress !== undefined && (
                  <>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                        style={{ width: `${migrationProgress}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-[var(--color-muted)]">
                      {formatBytes(migrationState.movedBytes)} /{" "}
                      {formatBytes(migrationState.totalBytes)}
                    </p>
                  </>
                )}
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
              onChange={(event) => switchThemeMutation.mutate(event.target.value)}
              disabled={isLoading || !config || switchThemeMutation.isPending}
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

            {switchThemeMutation.isError && (
              <p className="mt-3 text-sm text-red-400">Failed to update theme.</p>
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
