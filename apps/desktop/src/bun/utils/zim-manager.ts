import { readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from "fs";
import { join, basename } from "path";
import { ensureDir, pathExists } from "./paths";

const LIBRARY_XML_FILENAME = "library.xml";

/**
 * Manages ZIM files and the kiwix library.xml in the library directory.
 *
 * The library.xml file is watched by kiwix-serve (--monitorLibrary)
 * so any changes to it are picked up automatically without restart.
 */
export class ZimManager {
  private libraryPath: string;
  private libraryXmlPath: string;

  constructor(libraryPath: string) {
    this.libraryPath = libraryPath;
    this.libraryXmlPath = join(libraryPath, LIBRARY_XML_FILENAME);
    ensureDir(this.libraryPath);
  }

  getZimFiles(): string[] {
    if (!pathExists(this.libraryPath)) {
      return [];
    }
    return readdirSync(this.libraryPath).filter((f) => f.endsWith(".zim"));
  }

  getZimPaths(): string[] {
    return this.getZimFiles().map((f) => join(this.libraryPath, f));
  }

  zimExists(filename: string): boolean {
    return pathExists(join(this.libraryPath, filename));
  }

  async deleteZim(filename: string): Promise<void> {
    const filePath = join(this.libraryPath, filename);
    if (!pathExists(filePath)) {
      throw new Error(`ZIM file not found: ${filename}`);
    }
    unlinkSync(filePath);
    this.removeBookFromXml(filename);
  }

  getLibraryXmlPath(): string {
    return this.libraryXmlPath;
  }

  getLibraryPath(): string {
    return this.libraryPath;
  }

  initLibraryXml(): void {
    const zimFiles = this.getZimFiles();
    const existingIds = this.getBookIds();
    let hasChanged = false;

    const books = this.readBooks();

    for (const zimFile of zimFiles) {
      const id = this.filenameToId(zimFile);
      if (!existingIds.has(id)) {
        const zimPath = join(this.libraryPath, zimFile);
        books.push({ id, path: zimPath });
        hasChanged = true;
        console.log(`[ZimManager] Queued "${zimFile} for the library.xml"`);
      }
    }

    if (hasChanged || !pathExists(this.libraryXmlPath)) {
      this.writeLibraryXml(books);
      console.log(`[ZimManager] Successfully updated library.xml`);
    }
  }

  addBookToXml(zimFilename: string): void {
    const books = this.readBooks();
    const id = this.filenameToId(zimFilename);
    if (books.some((b) => b.id === id)) {
      return;
    }

    const zimPath = join(this.libraryPath, zimFilename);
    books.push({ id, path: zimPath });
    this.writeLibraryXml(books);

    console.log(`[ZimManager] Added "${zimFilename}" to library.xml`);
  }

  // TODO: update to bulk remove
  removeBookFromXml(zimFilename: string): void {
    const books = this.readBooks();
    const id = this.filenameToId(zimFilename);
    const filtered = books.filter((b) => b.id !== id);

    if (filtered.length !== books.length) {
      this.writeLibraryXml(filtered);
      console.log(`[ZimManager] Removed "${zimFilename}" from library.xml`);
    }
  }

  private filenameToId(filename: string): string {
    return basename(filename, ".zim");
  }

  private getBookIds(): Set<string> {
    return new Set(this.readBooks().map((b) => b.id));
  }

  private readBooks(): { id: string; path: string }[] {
    if (!pathExists(this.libraryXmlPath)) {
      return [];
    }

    const xml = readFileSync(this.libraryXmlPath, "utf-8");
    const books: { id: string; path: string }[] = [];
    const bookRegex = /<book\s+id="([^"]*?)"\s+path="([^"]*?)"\s*\/?>/g;

    let match;
    while ((match = bookRegex.exec(xml)) !== null) {
      books.push({ id: match[1], path: match[2] });
    }

    return books;
  }

  private writeLibraryXml(books: { id: string; path: string }[]): void {
    const bookEntries = books
      .map((b) => `  <book id="${this.escapeXml(b.id)}" path="${this.escapeXml(b.path)}" />`)
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<library version="1.0">\n${bookEntries}\n</library>\n`;

    const tempPath = `${this.libraryXmlPath}.tmp`;
    writeFileSync(tempPath, xml, "utf-8");

    renameSync(tempPath, this.libraryXmlPath);
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
