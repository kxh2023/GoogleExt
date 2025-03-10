// DocumentReader.ts - Improved reader for Overleaf LaTeX documents
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

// Create a class to handle document reading
export class DocumentReader {
  private editor: Element | null = null;
  private lastContent: DocumentContent | null = null;
  private changeListeners: ((content: DocumentContent) => void)[] = [];

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

    // Initial read
    this.readDocument();

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

    // Process each child node
    lineElement.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Plain text node
        const text = node.textContent || "";
        if (text.trim()) {
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
              if (text.trim()) {
                tokens.push({
                  type: "text",
                  text,
                });
                rawText += text;
              }
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
  private convertToLatexSource(lines: DocumentLine[]): string {
    return lines.map((line) => line.rawText).join("\n");
  }

  // Read the current state of the document
  readDocument(): DocumentContent {
    if (!this.editor) {
      throw new Error("Editor element not found");
    }

    const lines: DocumentLine[] = [];
    const lineElements = this.editor.querySelectorAll(".cm-line");

    lineElements.forEach((lineElement, index) => {
      const line = this.processLineElement(lineElement, index);
      lines.push(line);
    });

    const rawText = lines.map((line) => line.rawText).join("\n");
    const latexSource = this.convertToLatexSource(lines);

    const content: DocumentContent = {
      lines,
      rawText,
      latexSource,
      timestamp: Date.now(),
    };

    this.lastContent = content;
    return content;
  }

  // Handle document change events
  private handleDocumentChange(): void {
    try {
      const content = this.readDocument();

      // Only notify if content actually changed
      if (this.hasContentChanged(content)) {
        console.log("DocumentReader: Document changed");
        this.notifyChangeListeners(content);
      }
    } catch (error) {
      console.error("DocumentReader: Error reading document", error);
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
