// DocumentReader.ts - Auto-scrolling only when button is pressed
import { debounce } from "lodash";

// Types for the document content
export interface DocumentToken {
  type: string; // keyword, punctuation, string, etc.
  text: string;
  element?: HTMLElement;
}

export interface DocumentLine {
  lineNumber: number;
  tokens: DocumentToken[];
  rawText: string;
  element: HTMLElement;
}

export interface DocumentContent {
  lines: DocumentLine[];
  rawText: string;
  latexSource: string; // Pure LaTeX without HTML/DOM elements
  timestamp: number;
}

export const Tags = {
  observationInterval: 100, // ms between checking for editor changes
  editorSelector: ".cm-content",
  lineSelector: ".cm-line",
  cursorSelector: ".cm-cursor",
  selectionSelector: ".cm-selectionBackground",
  editorWrapperSelector: ".cm-editor",
  scrollerSelector: ".cm-scroller",
  gutterSelector: ".cm-gutters",
};

// Create a class to handle document reading
export class DocumentReader {
  private editor: Element | null = null;
  private scroller: Element | null = null;
  private lastContent: DocumentContent | null = null;
  private documentCache: string | null = null;
  private changeListeners: ((content: DocumentContent) => void)[] = [];
  private isCapturingFullDocument = false;

  constructor() {
    this.setupListeners = this.setupListeners.bind(this);
    this.readDocument = this.readDocument.bind(this);
    this.handleDocumentChange = debounce(
      this.handleDocumentChange.bind(this),
      300
    );
  }

  // Initialize the document reader with the editor element
  initialize(editorSelector: string = ".cm-content"): boolean {
    this.editor = document.querySelector(editorSelector);
    this.scroller = document.querySelector(Tags.scrollerSelector);

    if (!this.editor) {
      console.error("DocumentReader: Could not find editor element");
      return false;
    }

    console.log("DocumentReader: Initialized with editor element", this.editor);
    this.setupListeners();
    return true;
  }

  // Set up mutation observers and other listeners
  private setupListeners(): void {
    if (!this.editor) return;

    // Set up mutation observer to detect changes
    const observer = new MutationObserver(() => {
      this.handleDocumentChange();
    });

    observer.observe(this.editor, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false,
    });

    // Listen for keyboard events as a backup
    document.addEventListener("keyup", () => {
      this.handleDocumentChange();
    });

    console.log("DocumentReader: Listeners set up");
  }

  // Extract token information from a span element
  private extractToken(element: Element): DocumentToken {
    // Get token type from class
    const classList = element.classList;
    let type = "text"; // default

    if (classList.contains("tok-keyword")) type = "keyword";
    else if (classList.contains("tok-punctuation")) type = "punctuation";
    else if (classList.contains("tok-string")) type = "string";
    else if (classList.contains("tok-typeName")) type = "typeName";
    else if (classList.contains("tok-attributeValue")) type = "attributeValue";
    else if (classList.contains("tok-literal")) type = "literal";

    return {
      type,
      text: element.textContent || "",
      element: element as HTMLElement,
    };
  }

  // Process a line element to extract all tokens
  private processLineElement(
    lineElement: Element,
    index: number
  ): DocumentLine {
    const tokens: DocumentToken[] = [];
    let rawText = "";

    // Check if this is an empty line with only BR
    if (
      lineElement.childNodes.length === 1 &&
      lineElement.childNodes[0].nodeName === "BR"
    ) {
      return {
        lineNumber: index,
        tokens: [],
        rawText: "",
        element: lineElement as HTMLElement,
      };
    }

    // Process each child node
    lineElement.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Plain text node
        const text = node.textContent || "";
        if (text) {
          tokens.push({
            type: "text",
            text,
          });
          rawText += text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;

        // Skip widgets and fillers
        if (
          element.classList.contains("cm-widgetBuffer") ||
          element.classList.contains("ol-cm-filler")
        ) {
          return;
        }

        // Check if it's a token element (span with tok-* class)
        if (element.tagName === "SPAN" && element.className.includes("tok-")) {
          const token = this.extractToken(element);
          tokens.push(token);
          rawText += token.text;
        } else if (element.tagName === "BR") {
          // Handle line breaks
          tokens.push({
            type: "linebreak",
            text: "\n",
          });
          rawText += "\n";
        } else {
          // Other elements - recurse into children
          element.childNodes.forEach((childNode) => {
            if (childNode.nodeType === Node.TEXT_NODE) {
              const text = childNode.textContent || "";
              tokens.push({
                type: "text",
                text,
              });
              rawText += text;
            } else if (childNode.nodeType === Node.ELEMENT_NODE) {
              const childElement = childNode as Element;
              if (
                childElement.tagName === "SPAN" &&
                childElement.className.includes("tok-")
              ) {
                const token = this.extractToken(childElement);
                tokens.push(token);
                rawText += token.text;
              }
            }
          });
        }
      }
    });

    return {
      lineNumber: index,
      tokens,
      rawText,
      element: lineElement as HTMLElement,
    };
  }

  // Convert document to LaTeX source
  /*private convertToLatexSource(lines: DocumentLine[]): string {
    return lines.map((line) => line.rawText).join("\n");
  }*/

  // Get visible content from the current view
  private getVisibleContent(): string {
    if (!this.editor) {
      return "";
    }

    const lines: DocumentLine[] = [];
    const lineElements = this.editor.querySelectorAll(".cm-line");

    // Process each visible line
    lineElements.forEach((lineElement, index) => {
      const line = this.processLineElement(lineElement, index);
      lines.push(line);
    });

    // Create raw text with proper line breaks
    return lines.map((line) => line.rawText).join("\n");
  }

  // Capture the full document by auto-scrolling
  async captureFullDocument(): Promise<string> {
    if (this.isCapturingFullDocument) {
      // Already capturing, return existing cache if available
      return this.documentCache || "";
    }

    // First check if we already have a cache
    if (this.documentCache) {
      return this.documentCache;
    }

    this.isCapturingFullDocument = true;

    try {
      // Try to access Overleaf's internal API first
      try {
        // @ts-ignore
        if (window._ide && window._ide.editorManager) {
          // @ts-ignore
          const docContent = window._ide.editorManager.getCurrentDocValue();
          if (docContent) {
            console.log("Got full document from Overleaf API");
            this.documentCache = docContent;
            this.isCapturingFullDocument = false;
            return docContent;
          }
        }
      } catch (error) {
        console.error("Error accessing Overleaf API:", error);
      }

      // If API access fails, use auto-scrolling technique
      if (!this.scroller || !this.editor) {
        this.isCapturingFullDocument = false;
        return "";
      }

      // Save original scroll position
      const originalScrollTop = this.scroller.scrollTop;
      const maxScroll = this.scroller.scrollHeight;

      // First scroll to top to start fresh
      this.scroller.scrollTop = 0;
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for render

      // Initialize document content with top view
      let fullContent = this.getVisibleContent();
      let contentMap = new Map<number, string>();
      contentMap.set(0, fullContent);

      // Determine scroll step based on editor height
      const scrollStep = Math.floor(this.scroller.clientHeight * 0.7); // 70% overlap
      let currentScrollPos = 0;

      console.log("Starting auto-scroll capture");

      // Scroll through the document
      while (currentScrollPos < maxScroll) {
        // Move to next position
        currentScrollPos += scrollStep;
        if (currentScrollPos > maxScroll) {
          currentScrollPos = maxScroll;
        }

        this.scroller.scrollTop = currentScrollPos;

        // Wait for the content to render
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get content at this position
        const visibleContent = this.getVisibleContent();
        contentMap.set(currentScrollPos, visibleContent);

        // If we've reached the bottom, break
        if (currentScrollPos >= maxScroll) {
          break;
        }
      }

      // Scroll back to original position
      this.scroller.scrollTop = originalScrollTop;

      // Merge all content chunks
      let mergedContent = "";
      let seenLines = new Set<string>();

      // Sort by scroll position to ensure correct order
      const sortedPositions = Array.from(contentMap.keys()).sort(
        (a, b) => a - b
      );

      for (const pos of sortedPositions) {
        const chunk = contentMap.get(pos) || "";
        const lines = chunk.split("\n");

        for (const line of lines) {
          // Only add lines we haven't seen before (deduplication)
          if (!seenLines.has(line)) {
            if (mergedContent) {
              mergedContent += "\n";
            }
            mergedContent += line;
            seenLines.add(line);
          }
        }
      }

      console.log("Completed auto-scroll capture");

      // Cache the result
      this.documentCache = mergedContent;
      return mergedContent;
    } finally {
      this.isCapturingFullDocument = false;
    }
  }

  // Read the current state of the document - only returns what's visible unless cache is available
  readVisibleDocument(): DocumentContent {
    if (!this.editor) {
      throw new Error("Editor element not found");
    }

    const visibleLines: DocumentLine[] = [];
    const lineElements = this.editor.querySelectorAll(".cm-line");

    lineElements.forEach((lineElement, index) => {
      const line = this.processLineElement(lineElement, index);
      visibleLines.push(line);
    });

    const rawText = visibleLines.map((line) => line.rawText).join("\n");

    const content: DocumentContent = {
      lines: visibleLines,
      rawText,
      latexSource: rawText,
      timestamp: Date.now(),
    };

    this.lastContent = content;
    return content;
  }

  // Read the document using the cache or capturing if requested
  async readDocument(forceCapture: boolean = false): Promise<DocumentContent> {
    // If we need to force a capture or don't have a cache yet
    if (forceCapture || !this.documentCache) {
      // Capture the full document (via API or auto-scrolling)
      const contentText = await this.captureFullDocument();

      // Create DocumentContent from the captured text
      if (contentText) {
        const lines = contentText.split("\n").map((lineText, index) => ({
          lineNumber: index,
          tokens: [{ type: "text", text: lineText }],
          rawText: lineText,
          element: document.createElement("div") as HTMLElement,
        }));

        const content: DocumentContent = {
          lines,
          rawText: contentText,
          latexSource: contentText,
          timestamp: Date.now(),
        };

        this.lastContent = content;
        return content;
      }
    }
    // If we have a cache and aren't forcing a capture
    else if (this.documentCache) {
      // Use the cached content
      const lines = this.documentCache.split("\n").map((lineText, index) => ({
        lineNumber: index,
        tokens: [{ type: "text", text: lineText }],
        rawText: lineText,
        element: document.createElement("div") as HTMLElement,
      }));

      const content: DocumentContent = {
        lines,
        rawText: this.documentCache,
        latexSource: this.documentCache,
        timestamp: Date.now(),
      };

      this.lastContent = content;
      return content;
    }

    // Fallback to just visible content
    return this.readVisibleDocument();
  }

  // Handle document change events
  private handleDocumentChange(): void {
    try {
      // Clear the cache when the document changes
      this.documentCache = null;

      // Just read visible content for mutation observers
      const content = this.readVisibleDocument();

      // Only notify if content actually changed
      if (this.hasContentChanged(content)) {
        console.log("DocumentReader: Document changed");
        this.notifyChangeListeners(content);
      }
    } catch (error) {
      console.error("DocumentReader: Error handling document change", error);
    }
  }

  // Check if the content has changed significantly
  private hasContentChanged(newContent: DocumentContent): boolean {
    if (!this.lastContent) return true;

    // Compare the raw text
    return this.lastContent.rawText !== newContent.rawText;
  }

  // Send the content to all registered listeners
  private notifyChangeListeners(content: DocumentContent): void {
    this.changeListeners.forEach((listener) => {
      try {
        listener(content);
      } catch (error) {
        console.error("DocumentReader: Error in change listener", error);
      }
    });
  }

  // Subscribe to document changes
  onDocumentChange(listener: (content: DocumentContent) => void): () => void {
    this.changeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  // Get the current document content
  getCurrentContent(): DocumentContent | null {
    return this.lastContent;
  }
}

// Create and export a singleton instance
const DocumentReaderInstance = new DocumentReader();
export default DocumentReaderInstance;
