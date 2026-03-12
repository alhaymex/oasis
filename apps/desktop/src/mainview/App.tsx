import { useState, useEffect } from "react";

const KIWIX_URL = "http://127.0.0.1:9999";

interface Book {
  id: string;
  title: string;
  description: string;
  language: string;
  name: string;
}

interface SearchResult {
  title: string;
  path: string;
}

function App() {
  const [view, setView] = useState<"library" | "reader">("library");
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kiwixRunning, setKiwixRunning] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${KIWIX_URL}/catalog/v2/entries?count=-1`);

      if (!response.ok) {
        setKiwixRunning(false);
        setError(null);
        setBooks([]);
        return;
      }

      setKiwixRunning(true);
      const data = await response.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(data, "text/xml");
      const entries = xml.querySelectorAll("entry");

      const booksList: Book[] = Array.from(entries).map((entry) => ({
        id: entry.querySelector("id")?.textContent || "",
        title: entry.querySelector("title")?.textContent || "Untitled",
        description: entry.querySelector("summary")?.textContent || "",
        language: entry.querySelector("language")?.textContent || "",
        name: entry.querySelector("name")?.textContent || "",
      }));

      setBooks(booksList);
      setError(null);
    } catch (err) {
      setKiwixRunning(false);
      setBooks([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, bookName: string) => {
    if (!query || !bookName) return;

    try {
      const response = await fetch(
        `${KIWIX_URL}/search?pattern=${encodeURIComponent(query)}&books.name=${bookName}&format=html`
      );
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = doc.querySelectorAll("a");

      const results: SearchResult[] = Array.from(links)
        .filter((link) => link.getAttribute("href")?.startsWith("/"))
        .map((link) => ({
          title: link.textContent || "Untitled",
          path: link.getAttribute("href") || "",
        }));

      setSearchResults(results);
    } catch (err) {
      console.error("Failed to search:", err);
    }
  };

  const openBook = (book: Book) => {
    setSelectedBook(book);
    setView("reader");
  };

  const openArticle = (path: string) => {
    if (selectedBook) {
      window.open(`${KIWIX_URL}/content/${selectedBook.name}${path}`, "_blank");
    }
  };

  const filteredBooks = searchQuery
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading library...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {view === "library" ? (
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-center mb-2">Oasis</h1>
            <p className="text-gray-400 text-center mb-6">Your offline reading library</p>

            {kiwixRunning && books.length > 0 && (
              <div className="max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                />
              </div>
            )}
          </header>

          {!kiwixRunning || books.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-semibold mb-2">No books yet</h2>
              <p className="text-gray-400 mb-6">Add ZIM files to your library to get started.</p>
              <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold mb-3">How to add books:</h3>
                <ul className="text-left text-gray-300 space-y-2 text-sm">
                  <li>1. Go to Settings to change library directory</li>
                  <li>2. Download ZIM files from kiwix.org</li>
                  <li>3. Place .zim files in your library folder</li>
                  <li>4. Restart the app</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => openBook(book)}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                >
                  <div className="h-48 bg-gray-700 flex items-center justify-center">
                    <img
                      src={`${KIWIX_URL}/catalog/v2/illustration/${book.id}?size=300`}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%374151" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%9ca3af" font-size="12">No Cover</text></svg>';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{book.description}</p>
                    {book.language && (
                      <span className="text-xs text-gray-500 mt-2 inline-block">
                        {book.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredBooks.length === 0 && books.length > 0 && (
            <div className="text-center text-gray-500 mt-8">No books found</div>
          )}
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          <header className="bg-gray-800 px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => setView("library")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h2 className="font-semibold">{selectedBook?.title}</h2>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search in this book..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedBook) {
                    handleSearch(e.currentTarget.value, selectedBook.name);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-purple-500 text-white text-sm"
              />
            </div>
          </header>

          {searchResults.length > 0 && (
            <div className="bg-gray-800 border-t border-gray-700 max-h-64 overflow-y-auto">
              <div className="p-2">
                {searchResults.slice(0, 10).map((result, i) => (
                  <div
                    key={i}
                    onClick={() => openArticle(result.path)}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer rounded"
                  >
                    {result.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          <iframe
            key={selectedBook?.id}
            src={`${KIWIX_URL}/content/${selectedBook?.name}/`}
            className="flex-1 w-full border-0"
            title="Reader"
          />
        </div>
      )}
    </div>
  );
}

export default App;
