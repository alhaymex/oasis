import type { LibraryBook } from "@/shared/types";
import { formatBytes, getZimId } from "@/shared/utils";
import { BookMarked, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface LibraryCardProps {
  book: LibraryBook;
  isFavorite?: boolean;
  onToggleFavorite?: (bookId: string, nextValue: boolean) => void;
}

export default function LibraryCard({
  book,
  isFavorite = false,
  onToggleFavorite,
}: LibraryCardProps) {
  const icon = <BookOpen className="w-10 h-10" />;

  return (
    <Link to={`/view/${getZimId(book.id)}`} className="block h-full">
      <div className="group relative flex flex-col w-48 h-full cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus:outline-none">
        <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden shadow-lg ring-1 ring-[var(--color-border)] group-hover:ring-[var(--color-primary)] transition-all duration-300">
          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/50 to-transparent z-10" />
          {onToggleFavorite && (
            <button
              type="button"
              aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
              className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 text-[var(--color-accent)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleFavorite(book.id, !isFavorite);
              }}
            >
              <BookMarked
                className="h-4 w-4"
                style={{ color: isFavorite ? "var(--color-primary)" : undefined }}
              />
            </button>
          )}

          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface)] via-[#1a3a4d] to-[var(--color-bg)]" />

          <div className="relative z-10 flex flex-col items-center justify-center h-full p-5 gap-4">
            <div className="text-[var(--color-primary)] opacity-80 group-hover:opacity-100 transition-opacity">
              {icon}
            </div>
            <span className="text-sm font-bold text-[var(--color-accent)] text-center leading-tight line-clamp-2">
              {book.title || book.name || "Untitled"}
            </span>
            <span className="text-xs text-[var(--color-muted)] text-center leading-snug line-clamp-3">
              {book.summary || "No description available"}
            </span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
        </div>

        <div className="mt-2 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-bold">
            {book.language || "English"}
          </span>
          <span className="text-xs text-[var(--color-muted)] text-center">
            {formatBytes(book.sizeBytes ?? 0)}
          </span>
        </div>
      </div>
    </Link>
  );
}
