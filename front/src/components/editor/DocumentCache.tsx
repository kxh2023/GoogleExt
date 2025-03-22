// DocumentCache.ts - Enhanced with partial updates and version tracking
import { DocumentContent } from "./DocumentReader";

export interface CacheUpdateEvent {
  type: "full" | "partial";
  content: DocumentContent | string[];
  lineRange?: {
    start: number;
    end: number;
  };
  timestamp: number;
  version: number;
}

export class DocumentCache {
  private documentCache: string | null = null;
  private cachedLines: string[] = [];
  private lastUpdateTimestamp: number = 0;
  private cacheVersion: number = 0;
  private changeListeners: ((
    content: DocumentContent,
    event: CacheUpdateEvent
  ) => void)[] = [];
  private partialUpdateThreshold: number = 5000; // ms between allowing partial updates

  // Singleton instance
  private static instance: DocumentCache;

  // Get the singleton instance
  public static getInstance(): DocumentCache {
    if (!DocumentCache.instance) {
      DocumentCache.instance = new DocumentCache();
    }
    return DocumentCache.instance;
  }

  // Private constructor for singleton
  private constructor() {}

  // Update the cache with a full document
  updateFullCache(content: DocumentContent): void {
    console.log("Cache: Updating full document cache");
    this.documentCache = content.rawText;
    this.cachedLines = content.rawText.split("\n");
    this.lastUpdateTimestamp = content.timestamp;
    this.cacheVersion++;

    const updateEvent: CacheUpdateEvent = {
      type: "full",
      content,
      timestamp: content.timestamp,
      version: this.cacheVersion,
    };

    // Notify listeners of the change
    this.notifyChangeListeners(content, updateEvent);
  }

  // Update the cache with a partial change
  updatePartialCache(
    newLines: string[],
    startLineIndex: number
  ): DocumentContent {
    if (!this.documentCache) {
      console.error("Cache: Cannot update partial cache, no full cache exists");
      throw new Error("No full cache exists");
    }

    console.log(
      `Cache: Updating partial cache at line ${startLineIndex}, ${newLines.length} lines`
    );

    // If it's been too long since the last update, consider this unreliable
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTimestamp;

    if (timeSinceLastUpdate > this.partialUpdateThreshold) {
      console.warn(
        `Cache: Last update was ${timeSinceLastUpdate}ms ago, partial update may be unreliable`
      );
      // We'll still proceed, but log the warning
    }

    // Update the cached lines
    let linesChanged = false;

    // Check if we need to expand the cached lines array
    if (startLineIndex + newLines.length > this.cachedLines.length) {
      const extraLines =
        startLineIndex + newLines.length - this.cachedLines.length;
      this.cachedLines = [...this.cachedLines, ...Array(extraLines).fill("")];
      linesChanged = true;
    }

    // Replace the affected lines
    for (let i = 0; i < newLines.length; i++) {
      const targetIndex = startLineIndex + i;
      if (this.cachedLines[targetIndex] !== newLines[i]) {
        this.cachedLines[targetIndex] = newLines[i];
        linesChanged = true;
      }
    }

    // Only update if something actually changed
    if (linesChanged) {
      // Reconstruct the full document
      this.documentCache = this.cachedLines.join("\n");
      this.cacheVersion++;
      this.lastUpdateTimestamp = now;

      // Create a new document content object
      const updatedContent: DocumentContent = {
        rawText: this.documentCache,
        timestamp: now,
      };

      const updateEvent: CacheUpdateEvent = {
        type: "partial",
        content: newLines,
        lineRange: {
          start: startLineIndex,
          end: startLineIndex + newLines.length - 1,
        },
        timestamp: now,
        version: this.cacheVersion,
      };

      // Notify listeners of the change
      this.notifyChangeListeners(updatedContent, updateEvent);

      return updatedContent;
    } else {
      console.log("Cache: No changes detected in partial update");
      return this.getCacheAsDocumentContent()!;
    }
  }

  // Check if cache exists
  hasCache(): boolean {
    return this.documentCache !== null;
  }

  // Get the cached document
  getCache(): string | null {
    return this.documentCache;
  }

  // Get cached lines directly
  getCachedLines(): string[] {
    return [...this.cachedLines];
  }

  // Get a range of lines from the cache
  getCachedLineRange(startLine: number, endLine: number): string[] {
    if (!this.hasCache()) {
      return [];
    }

    return this.cachedLines.slice(
      Math.max(0, startLine),
      Math.min(this.cachedLines.length, endLine + 1)
    );
  }

  // Get the timestamp of the last update
  getLastUpdateTimestamp(): number {
    return this.lastUpdateTimestamp;
  }

  // Get the current cache version
  getCacheVersion(): number {
    return this.cacheVersion;
  }

  // Create a DocumentContent object from the cache
  getCacheAsDocumentContent(): DocumentContent | null {
    if (!this.documentCache) {
      return null;
    }

    return {
      rawText: this.documentCache,
      timestamp: this.lastUpdateTimestamp || Date.now(),
    };
  }

  // Clear the cache
  clearCache(): void {
    this.documentCache = null;
    this.cachedLines = [];
    this.lastUpdateTimestamp = 0;
    this.cacheVersion = 0;
    console.log("Cache: Document cache cleared");
  }

  // Subscribe to cache changes
  onCacheChange(
    listener: (content: DocumentContent, event: CacheUpdateEvent) => void
  ): () => void {
    this.changeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  // Notify listeners of changes
  private notifyChangeListeners(
    content: DocumentContent,
    event: CacheUpdateEvent
  ): void {
    this.changeListeners.forEach((listener) => {
      try {
        listener(content, event);
      } catch (error) {
        console.error("Cache: Error in change listener", error);
      }
    });
  }

  // Set the threshold for considering partial updates potentially unreliable
  setPartialUpdateThreshold(milliseconds: number): void {
    this.partialUpdateThreshold = milliseconds;
  }
}

// Export the singleton instance
const DocumentCacheInstance = DocumentCache.getInstance();
export default DocumentCacheInstance;
