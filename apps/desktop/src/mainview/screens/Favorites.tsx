import { Link } from "react-router-dom";
import LibraryCard from "../components/LibraryCard";
import { useFavoriteMutations, useFavorites } from "../hooks/useFavorites";

export default function Favorites() {
  const { data: favorites, isLoading, error } = useFavorites();
  const { addFavorite, removeFavorite } = useFavoriteMutations();

  const handleToggleFavorite = (bookId: string, nextValue: boolean) => {
    if (nextValue) {
      addFavorite.mutate(bookId);
      return;
    }

    removeFavorite.mutate(bookId);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-[1400px]">
        <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-1">Favorites</h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Saved titles you want to return to quickly
        </p>

        {isLoading ? (
          <p className="text-sm text-[var(--color-muted)] animate-pulse">Loading favorites...</p>
        ) : error ? (
          <p className="text-sm text-red-400">Failed to load favorites.</p>
        ) : !favorites?.length ? (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <p className="text-lg text-[var(--color-muted)] mb-4">You have no favorites yet.</p>
            <Link
              to="/library"
              className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-md font-bold hover:brightness-110 transition-all"
            >
              Open Library
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6 justify-items-center items-start">
            {favorites.map((book) => (
              <LibraryCard
                key={book.id}
                book={book}
                isFavorite
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
