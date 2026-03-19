import { useEffect, useState } from "react";
import { BookMarked, Clipboard, NotebookPen, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { useLibrary } from "../hooks/useLibrary";
import { useFavoriteMutations, useFavorites } from "../hooks/useFavorites";
import { useNoteMutations } from "../hooks/useNotes";
import { getZimId } from "@/shared/utils";

type RouteParams = {
  id: string;
};
const baseUrl = "http://localhost:9999";

function View() {
  const { id } = useParams<RouteParams>();
  const currentId = id ?? "";
  const { data: books } = useLibrary();
  const { data: favorites } = useFavorites();
  const { addFavorite, removeFavorite } = useFavoriteMutations();
  const { createNote } = useNoteMutations();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [body, setBody] = useState("");
  const [clipboardStatus, setClipboardStatus] = useState<string | null>(null);

  const iframeSrc = `${baseUrl}/content/${currentId}`;
  const book = books?.find((entry) => getZimId(entry.id) === currentId);
  const isFavorite = favorites?.some((favorite) => favorite.id === book?.id) ?? false;

  useEffect(() => {
    if (!book) {
      return;
    }

    setSourceTitle(book.title || book.name || currentId);
    setSourceUrl(`${baseUrl}/content/${currentId}`);
  }, [book, currentId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "object" || !event.data) {
        return;
      }

      if ((event.data as { type?: string }).type !== "oasis-selection") {
        return;
      }

      const payload = event.data as {
        selectedText?: string;
        sourceUrl?: string;
        sourceTitle?: string;
      };

      setSelectedText(payload.selectedText ?? "");
      setSourceUrl(payload.sourceUrl ?? `${baseUrl}/content/${currentId}`);
      setSourceTitle(payload.sourceTitle ?? book?.title ?? book?.name ?? currentId);
      setIsNoteModalOpen(true);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [book, currentId]);

  const resetComposer = () => {
    setSelectedText("");
    setBody("");
    setClipboardStatus(null);
    setSourceTitle(book?.title || book?.name || currentId);
    setSourceUrl(`${baseUrl}/content/${currentId}`);
  };

  const openNoteModal = () => {
    resetComposer();
    setIsNoteModalOpen(true);
  };

  const handleToggleFavorite = () => {
    if (!book) {
      return;
    }

    if (isFavorite) {
      removeFavorite.mutate(book.id);
      return;
    }

    addFavorite.mutate(book.id);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setClipboardStatus("Clipboard is empty.");
        return;
      }

      setSelectedText(text);
      setClipboardStatus("Copied quote from clipboard.");
    } catch {
      setClipboardStatus("Clipboard access was blocked.");
    }
  };

  const handleCreateNote = async () => {
    const noteBody = body.trim();
    if (!noteBody) {
      return;
    }

    await createNote.mutateAsync({
      bookId: book?.id ?? null,
      sourceUrl: sourceUrl.trim() || `${baseUrl}/content/${currentId}`,
      sourceTitle: sourceTitle.trim() || book?.title || book?.name || currentId,
      selectedText: selectedText.trim() || null,
      body: noteBody,
    });

    setIsNoteModalOpen(false);
    resetComposer();
  };

  return (
    <div className="relative w-full h-screen p-3">
      <div className="absolute left-6 top-6 right-6 z-20 flex items-start justify-between gap-3 pointer-events-none">
        <div className="max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-3 shadow-lg backdrop-blur-sm pointer-events-auto">
          <p className="text-sm font-semibold text-[var(--color-accent)]">
            {book?.title || book?.name || "Reader"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Notes save the current source entry and can optionally include copied text from the
            clipboard.
          </p>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {book && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2 text-sm text-[var(--color-accent)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <BookMarked
                className="h-4 w-4"
                style={{ color: isFavorite ? "var(--color-primary)" : undefined }}
              />
              {isFavorite ? "Favorited" : "Favorite"}
            </button>
          )}

          <button
            type="button"
            onClick={openNoteModal}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2 text-sm text-[var(--color-accent)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <NotebookPen className="h-4 w-4" />
            Add Note
          </button>
        </div>
      </div>

      <iframe
        src={iframeSrc}
        className="rounded-lg"
        title="Site Viewer"
        width="100%"
        height="100%"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />

      {isNoteModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-accent)]">Create Note</h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Select text in the reader, copy it, then use the clipboard button to attach it.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  resetComposer();
                }}
                className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Source Title
                </label>
                <input
                  value={sourceTitle}
                  onChange={(event) => setSourceTitle(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Source URL
                </label>
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    Selected Text
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-accent)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                    Use Clipboard
                  </button>
                </div>
                <textarea
                  value={selectedText}
                  onChange={(event) => setSelectedText(event.target.value)}
                  rows={4}
                  placeholder="Paste a quote or selected text from the page"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
                />
                {clipboardStatus && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{clipboardStatus}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Note
                </label>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={6}
                  placeholder="Write your note"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  resetComposer();
                }}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-accent)] transition-colors hover:border-[var(--color-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={!body.trim() || createNote.isPending}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] transition-opacity hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createNote.isPending ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default View;
