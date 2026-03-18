import { useLibrary } from "../hooks/useLibrary";
import LibraryCard from "../components/LibraryCard";
import { Link } from "react-router-dom";

function Library() {
  const { data: books, isLoading, error } = useLibrary();

  return (
    <div className="flex-1 overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-[1400px]">
        <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-1">My Library</h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Downloaded content available offline
        </p>

        {isLoading ? (
          <p className="text-sm text-[var(--color-muted)] animate-pulse">Loading library...</p>
        ) : error ? (
          <p className="text-sm text-red-400">Failed to load library.</p>
        ) : !books || books.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <p className="text-lg text-[var(--color-muted)] mb-4">Your library is empty.</p>
            <Link 
              to="/browse" 
              className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-md font-bold hover:brightness-110 transition-all"
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-10 gap-x-6 justify-items-center">
            {books.map((book) => (
              <LibraryCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Library;
