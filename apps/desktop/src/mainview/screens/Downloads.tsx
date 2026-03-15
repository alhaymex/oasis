import { useDownloadStore } from "../store";
import { Pause, X, AlertCircle, CheckCircle2 } from "lucide-react";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function Downloads() {
  const downloadsMap = useDownloadStore((state) => state.downloads);
  const downloads = Object.values(downloadsMap);

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[var(--color-accent)] mb-8">Downloads</h1>

      {downloads.length === 0 ? (
        <p className="text-[var(--color-muted)]">No active downloads.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {downloads.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h3 className="text-[var(--color-accent)] font-semibold truncate" title={d.filename}>
                    {d.filename}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] mt-1 capitalize">
                    {d.status === "error" && (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Error: {d.error}
                      </span>
                    )}
                    {d.status === "completed" && (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {d.status === "downloading" && "Downloading..."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg)] rounded-full transition-colors"
                    title="Pause (Not Implemented)"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-[var(--color-muted)] hover:text-red-400 hover:bg-[var(--color-bg)] rounded-full transition-colors"
                    title="Cancel (Not Implemented)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-[var(--color-bg)] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    d.status === "error"
                      ? "bg-red-500"
                      : d.status === "completed"
                      ? "bg-green-500"
                      : "bg-[var(--color-primary)]"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, d.progress))}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                <span>
                  {formatBytes(d.downloadedBytes)} / {formatBytes(d.totalBytes)}
                </span>
                {d.status === "downloading" && <span>{formatBytes(d.bytesPerSec)}/s</span>}
                {d.status === "completed" && <span>100%</span>}
                {d.status === "downloading" && <span>{Math.round(d.progress)}%</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
