import { useEffect, useState } from "react";
import type { NoteRecord } from "@/shared/types";
import { useNoteMutations, useNotes } from "../hooks/useNotes";

type DraftState = {
  sourceTitle: string;
  sourceUrl: string;
  selectedText: string;
  body: string;
};

const emptyDraft: DraftState = {
  sourceTitle: "",
  sourceUrl: "",
  selectedText: "",
  body: "",
};

function NoteForm({
  title,
  draft,
  submitLabel,
  isPending,
  onChange,
  onSubmit,
}: {
  title: string;
  draft: DraftState;
  submitLabel: string;
  isPending?: boolean;
  onChange: (nextDraft: DraftState) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="text-lg font-semibold text-[var(--color-accent)]">{title}</h2>
      <div className="mt-4 grid gap-4">
        <input
          value={draft.sourceTitle}
          onChange={(event) => onChange({ ...draft, sourceTitle: event.target.value })}
          placeholder="Source title"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
        <input
          value={draft.sourceUrl}
          onChange={(event) => onChange({ ...draft, sourceUrl: event.target.value })}
          placeholder="Source URL"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
        <textarea
          value={draft.selectedText}
          onChange={(event) => onChange({ ...draft, selectedText: event.target.value })}
          rows={3}
          placeholder="Selected text or quote"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
        <textarea
          value={draft.body}
          onChange={(event) => onChange({ ...draft, body: event.target.value })}
          rows={5}
          placeholder="Write your note"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={!draft.body.trim() || isPending}
          onClick={onSubmit}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] transition-opacity hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

function mapNoteToDraft(note: NoteRecord): DraftState {
  return {
    sourceTitle: note.sourceTitle ?? "",
    sourceUrl: note.sourceUrl ?? "",
    selectedText: note.selectedText ?? "",
    body: note.body,
  };
}

function NoteItem({
  note,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  note: NoteRecord;
  onSave: (id: string, draft: DraftState) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}) {
  const [draft, setDraft] = useState(() => mapNoteToDraft(note));

  useEffect(() => {
    setDraft(mapNoteToDraft(note));
  }, [note]);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-accent)]">
            {note.sourceTitle || "Untitled source"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)] break-all">
            {note.sourceUrl || "No source URL"}
          </p>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          {new Date(note.updatedAt ?? note.createdAt ?? Date.now()).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <input
          value={draft.sourceTitle}
          onChange={(event) => setDraft({ ...draft, sourceTitle: event.target.value })}
          placeholder="Source title"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
        <input
          value={draft.sourceUrl}
          onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })}
          placeholder="Source URL"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
        <textarea
          value={draft.selectedText}
          onChange={(event) => setDraft({ ...draft, selectedText: event.target.value })}
          rows={3}
          placeholder="Selected text or quote"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
        <textarea
          value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
          rows={5}
          placeholder="Write your note"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-accent)] outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 transition-colors hover:border-red-400 hover:text-red-200 disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => onSave(note.id, draft)}
          disabled={!draft.body.trim() || isSaving}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] transition-opacity hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function Notes() {
  const { data: notes, isLoading, error } = useNotes();
  const { createNote, updateNote, deleteNote } = useNoteMutations();
  const [newDraft, setNewDraft] = useState<DraftState>(emptyDraft);

  const handleCreateNote = async () => {
    await createNote.mutateAsync({
      sourceTitle: newDraft.sourceTitle.trim() || null,
      sourceUrl: newDraft.sourceUrl.trim() || null,
      selectedText: newDraft.selectedText.trim() || null,
      body: newDraft.body.trim(),
    });

    setNewDraft(emptyDraft);
  };

  const handleSaveNote = async (id: string, draft: DraftState) => {
    await updateNote.mutateAsync({
      id,
      sourceTitle: draft.sourceTitle.trim() || null,
      sourceUrl: draft.sourceUrl.trim() || null,
      selectedText: draft.selectedText.trim() || null,
      body: draft.body.trim(),
    });
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote.mutateAsync(id);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-1">Notes</h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Save excerpts, URLs, and your own annotations for anything you read offline
        </p>

        <div className="grid gap-6">
          <NoteForm
            title="New Note"
            draft={newDraft}
            onChange={setNewDraft}
            onSubmit={handleCreateNote}
            submitLabel="Create Note"
            isPending={createNote.isPending}
          />

          {isLoading ? (
            <p className="text-sm text-[var(--color-muted)] animate-pulse">Loading notes...</p>
          ) : error ? (
            <p className="text-sm text-red-400">Failed to load notes.</p>
          ) : !notes?.length ? (
            <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
              No notes yet. Create one here or add a note directly from the reader.
            </p>
          ) : (
            notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
                isSaving={updateNote.isPending && updateNote.variables?.id === note.id}
                isDeleting={deleteNote.isPending && deleteNote.variables === note.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
