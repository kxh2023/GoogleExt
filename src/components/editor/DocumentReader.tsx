// DocumentReader.ts - CodeMirror API with scrolling fallback
import { debounce } from "lodash";

// Simplified DocumentContent interface
export interface DocumentContent {
  rawText: string;
  timestamp: number;
}

// Create a class to handle document reading
export class DocumentReader {
  private editor: Element | null = null;
  private scrollContainer: Element | null = null;
  private documentCache: string | null = null;
  private changeListeners: ((content: DocumentContent) => void)[] = [];
  private lastContent: DocumentContent | null = null;
  private tempTextArea: HTMLTextAreaElement | null = null;
  private isCapturing: boolean = false;
  private codeMirrorInstance: any = null; // CodeMirror instance

  constructor() {
    this.handleDocumentChange = debounce(
      this.handleDocumentChange.bind(this),
      300
    );

    // Create a hidden textarea for clipboard operations
    this.createHiddenTextArea();
  }

  // Create a hidden textarea for clipboard operations
  private createHiddenTextArea(): void {
    // Remove existing textarea if any
    const existingTextArea = document.getElementById(
      "document-reader-clipboard"
    );
    if (existingTextArea) {
      existingTextArea.remove();
    }

    // Create new textarea
    this.tempTextArea = document.createElement("textarea");
    this.tempTextArea.id = "document-reader-clipboard";
    this.tempTextArea.style.position = "fixed";
    this.tempTextArea.style.top = "-9999px";
    this.tempTextArea.style.left = "-9999px";
    this.tempTextArea.style.width = "2px";
    this.tempTextArea.style.height = "2px";
    this.tempTextArea.style.opacity = "0";
    document.body.appendChild(this.tempTextArea);

    console.log(
      "DocumentReader: Created hidden textarea for clipboard operations"
    );
  }

  // Initialize the document reader with the editor element
  initialize(): boolean {
    // Try to get CodeMirror instance directly from Overleaf
    try {
      // @ts-ignore
      if (window._ide && window._ide.editorManager) {
        // @ts-ignore
        const cm = window._ide.editorManager.getCurrentEditor()?.codeMirror;
        if (cm) {
          this.codeMirrorInstance = cm;
          console.log(
            "DocumentReader: Found CodeMirror instance via Overleaf API",
            cm
          );
        }
      }
    } catch (err) {
      console.warn(
        "DocumentReader: Couldn't access CodeMirror via Overleaf API",
        err
      );
    }

    // Find the editor element
    const editorSelectors = [
      ".CodeMirror", // CodeMirror container
      ".CodeMirror-code", // CodeMirror 5 code
      ".cm-content", // CodeMirror 6
      ".ace_text-input", // Ace Editor
      ".monaco-editor .view-lines", // Monaco
      "#editor-content", // Generic
      "#editor", // Generic
    ];

    for (const selector of editorSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.editor = element;
        console.log(
          `DocumentReader: Found editor with selector "${selector}"`,
          element
        );

        // Try to get CodeMirror instance from DOM element
        if (!this.codeMirrorInstance && selector === ".CodeMirror") {
          try {
            // @ts-ignore
            const cm = element.CodeMirror;
            if (cm) {
              this.codeMirrorInstance = cm;
              console.log(
                "DocumentReader: Found CodeMirror instance from DOM element",
                cm
              );
            }
          } catch (err) {
            console.warn(
              "DocumentReader: Couldn't get CodeMirror from DOM",
              err
            );
          }
        }

        break;
      }
    }

    if (!this.editor) {
      console.error("DocumentReader: Could not find any known editor element");
      return false;
    }

    // Find the scrollable container
    const scrollSelectors = [
      ".CodeMirror-scroll", // CodeMirror 5
      ".cm-scroller", // CodeMirror 6
      ".ace_scroller", // Ace Editor
      ".monaco-scrollable-element", // Monaco
      ".editor-scrollable", // Generic
    ];

    // First try explicit selectors
    for (const selector of scrollSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.scrollContainer = element;
        console.log(
          `DocumentReader: Found scroll container with selector "${selector}"`,
          element
        );
        break;
      }
    }

    // If no container found, try parent elements of the editor
    if (!this.scrollContainer && this.editor) {
      let parent = this.editor.parentElement;
      while (parent) {
        if (
          parent.scrollHeight > parent.clientHeight &&
          getComputedStyle(parent).overflow !== "hidden"
        ) {
          this.scrollContainer = parent;
          console.log("DocumentReader: Found scrollable parent", parent);
          break;
        }
        parent = parent.parentElement;
      }
    }

    // Set up listeners for document changes
    document.addEventListener("keyup", this.handleDocumentChange);

    return true;
  }

  // Get document content via CodeMirror API
  private getContentViaCodeMirrorAPI(): string | null {
    // Direct CodeMirror instance
    if (
      this.codeMirrorInstance &&
      typeof this.codeMirrorInstance.getValue === "function"
    ) {
      try {
        const content = this.codeMirrorInstance.getValue();
        console.log(
          `DocumentReader: Got content via CodeMirror API, length: ${content.length}`
        );
        return content;
      } catch (err) {
        console.warn(
          "DocumentReader: Error getting content via CodeMirror API",
          err
        );
      }
    }

    // Try Overleaf API
    try {
      // @ts-ignore
      if (window._ide && window._ide.editorManager) {
        // @ts-ignore
        const docContent = window._ide.editorManager.getCurrentDocValue();
        if (docContent) {
          console.log(
            `DocumentReader: Got content from Overleaf API, length: ${docContent.length}`
          );
          return docContent;
        }
      }
    } catch (err) {
      console.warn("DocumentReader: Couldn't access Overleaf API", err);
    }

    return null;
  }

  // Get content from visible lines
  private getVisibleContent(): string {
    if (!this.editor) {
      return "";
    }

    // For CodeMirror 5
    const cmLines = this.editor.querySelectorAll(".CodeMirror-line");
    if (cmLines.length > 0) {
      const content = Array.from(cmLines)
        .map((line) => line.textContent || "")
        .join("\n");
      return content;
    }

    // For CodeMirror 6
    const cm6Lines = this.editor.querySelectorAll(".cm-line");
    if (cm6Lines.length > 0) {
      const content = Array.from(cm6Lines)
        .map((line) => line.textContent || "")
        .join("\n");
      return content;
    }

    // Fallback to textContent
    return this.editor.textContent || "";
  }

  // Scroll to a specific line
  private async scrollToLine(line: number): Promise<void> {
    if (!this.codeMirrorInstance) {
      console.warn("DocumentReader: No CodeMirror instance for scrolling");
      return;
    }

    try {
      // Get line position
      const linePos = this.codeMirrorInstance.heightAtLine(line, "local");

      // Scroll to position
      this.codeMirrorInstance.scrollTo(null, linePos);

      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      console.warn(`DocumentReader: Error scrolling to line ${line}`, err);
    }
  }

  // Scroll to a specific position
  private async scrollTo(position: number): Promise<void> {
    if (!this.scrollContainer) {
      console.warn("DocumentReader: No scroll container found");
      return;
    }

    console.log(`DocumentReader: Scrolling to position ${position}`);
    this.scrollContainer.scrollTop = position;

    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Get line count via CodeMirror API
  private getLineCount(): number {
    if (
      this.codeMirrorInstance &&
      typeof this.codeMirrorInstance.lineCount === "function"
    ) {
      try {
        return this.codeMirrorInstance.lineCount();
      } catch (err) {
        console.warn("DocumentReader: Error getting line count", err);
      }
    }
    return 0;
  }

  // Process and clean duplicated content using CodeMirror line info if available
  private cleanDuplicatedContent(content: string): string {
    console.log("DocumentReader: Checking for duplicated content");

    if (!content || content.length < 100) {
      return content;
    }

    try {
      // If we have CodeMirror instance, try to use its line information
      if (
        this.codeMirrorInstance &&
        typeof this.codeMirrorInstance.lineCount === "function"
      ) {
        console.log("DocumentReader: Using CodeMirror API for line analysis");

        // Get total line count from CodeMirror
        const totalLines = this.codeMirrorInstance.lineCount();
        console.log(
          `DocumentReader: Document has ${totalLines} lines according to CodeMirror`
        );

        // Extract all lines using CodeMirror's getLine method
        const cmLines: string[] = [];
        for (let i = 0; i < totalLines; i++) {
          cmLines.push(this.codeMirrorInstance.getLine(i) || "");
        }

        // Find sequences of repeated lines
        const uniqueLines: string[] = [];
        const seenBlocks = new Map<string, number>();

        // Look for blocks of 20+ consecutive lines that repeat
        const blockSize = 20;

        for (let i = 0; i < cmLines.length - blockSize + 1; i++) {
          // Create a fingerprint for this block
          const blockContent = cmLines.slice(i, i + blockSize).join("\n");
          const blockHash = this.hashString(blockContent);

          if (seenBlocks.has(blockHash)) {
            // This is a duplicate block - skip ahead
            console.log(
              `DocumentReader: Found duplicate block at line ${i} (matches line ${seenBlocks.get(
                blockHash
              )})`
            );
            i += blockSize - 1; // Skip the entire block
          } else {
            // This is a new block - add the first line to unique lines
            uniqueLines.push(cmLines[i]);
            seenBlocks.set(blockHash, i);
          }
        }

        // Add any remaining lines
        for (let i = cmLines.length - blockSize + 1; i < cmLines.length; i++) {
          if (i > 0) uniqueLines.push(cmLines[i]);
        }

        console.log(
          `DocumentReader: Reduced from ${cmLines.length} to ${uniqueLines.length} lines using CodeMirror block analysis`
        );

        // If we found duplicates, return the cleaned content
        if (uniqueLines.length < cmLines.length) {
          return uniqueLines.join("\n");
        }
      }

      // Fallback to regular text analysis if CodeMirror isn't available or didn't find duplicates
      // Split content into lines for easier analysis
      const lines = content.split("\n");
      const totalLines = lines.length;

      console.log(
        `DocumentReader: Analyzing ${totalLines} lines for duplication (text-based method)`
      );

      // Find sequences of repeated lines
      const uniqueLines = [];
      let i = 0;

      while (i < totalLines) {
        uniqueLines.push(lines[i]);

        // Look for a duplicate of the current line
        const currentLine = lines[i].trim();
        if (currentLine.length > 10) {
          // Only check substantial lines
          // Find the next occurrence of this line
          let nextOccurrence = -1;
          for (let j = i + 1; j < totalLines; j++) {
            if (lines[j].trim() === currentLine) {
              nextOccurrence = j;
              break;
            }
          }

          // If we found a duplicate, check if it's part of a larger duplicated section
          if (nextOccurrence > i + 1) {
            // See how many lines match in sequence
            let matchingLines = 1;
            while (
              i + matchingLines < nextOccurrence &&
              nextOccurrence + matchingLines < totalLines &&
              lines[i + matchingLines].trim() ===
                lines[nextOccurrence + matchingLines].trim()
            ) {
              matchingLines++;
            }

            // If we have a substantial duplicate section, skip it
            if (matchingLines >= 5) {
              // At least 5 consecutive matching lines
              console.log(
                `DocumentReader: Found duplicate section of ${matchingLines} lines at line ${nextOccurrence}`
              );
              // Skip to after the original section (we'll skip the duplicate when we get there)
              i += matchingLines;
              continue;
            }
          }
        }

        i++;
      }

      // If we found duplicates, return the cleaned content
      if (uniqueLines.length < totalLines) {
        console.log(
          `DocumentReader: Reduced from ${totalLines} to ${uniqueLines.length} lines using text-based analysis`
        );
        return uniqueLines.join("\n");
      }
    } catch (error) {
      console.error(
        "DocumentReader: Error cleaning duplicated content:",
        error
      );
    }

    return content;
  }

  // Simple string hashing function
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  // Capture document by scrolling through it
  async captureFullDocument(): Promise<string> {
    if (this.isCapturing) {
      console.log("DocumentReader: Already capturing, please wait");
      return this.documentCache || "";
    }

    this.isCapturing = true;
    console.log("DocumentReader: Starting full document capture");

    try {
      // Method 1: Try via API first (most reliable)
      const apiContent = this.getContentViaCodeMirrorAPI();
      if (apiContent) {
        this.documentCache = apiContent;
        return apiContent;
      }

      // Method 2: If we have CodeMirror and scrollContainer, use scrolling with API
      if (this.codeMirrorInstance && this.scrollContainer) {
        console.log("DocumentReader: Using CodeMirror-based scrolling capture");

        // Get total line count
        const lineCount = this.getLineCount();
        if (lineCount > 0) {
          console.log(`DocumentReader: Document has ${lineCount} lines`);

          // Store original scroll position
          const originalScrollInfo = this.codeMirrorInstance.getScrollInfo();
          const originalScrollTop = originalScrollInfo.top;

          // Scroll to top
          await this.scrollToLine(0);

          // Use the direct API first (now that we're at the top)
          const fullContent = this.getContentViaCodeMirrorAPI();
          if (fullContent) {
            // Restore scroll position
            this.codeMirrorInstance.scrollTo(null, originalScrollTop);
            this.documentCache = fullContent;
            return fullContent;
          }

          // Lines-based approach: get all lines
          let allLines: string[] = [];

          // Calculate viewport height in lines
          const viewportLineCount = 50; // Estimate

          // Create chunks with overlap
          for (
            let startLine = 0;
            startLine < lineCount;
            startLine += viewportLineCount
          ) {
            // Scroll to this line
            await this.scrollToLine(startLine);

            // Get visible content
            const visibleContent = this.getVisibleContent();
            const visibleLines = visibleContent.split("\n");

            console.log(
              `DocumentReader: Captured ${visibleLines.length} lines at line ${startLine}`
            );

            // Add to all lines (simple approach)
            if (startLine === 0) {
              allLines = visibleLines;
            } else {
              // Try to find overlap
              let overlapFound = false;
              for (let i = 10; i > 0; i--) {
                // Check if last i lines of allLines match first i lines of visibleLines
                if (allLines.length >= i) {
                  const lastLines = allLines.slice(-i);
                  const firstLines = visibleLines.slice(0, i);

                  if (
                    lastLines.every((line, index) => line === firstLines[index])
                  ) {
                    // Found overlap, add only new lines
                    allLines = allLines.concat(visibleLines.slice(i));
                    overlapFound = true;
                    break;
                  }
                }
              }

              // If no overlap found, just append all
              if (!overlapFound) {
                allLines = allLines.concat(visibleLines);
              }
            }
          }

          // Restore original scroll position
          this.codeMirrorInstance.scrollTo(null, originalScrollTop);

          // Join all lines
          const content = allLines.join("\n");
          console.log(
            `DocumentReader: Assembled document of ${allLines.length} lines`
          );

          this.documentCache = content;
          return content;
        }
      }

      // Method 3: Generic scrolling approach
      if (this.scrollContainer) {
        console.log("DocumentReader: Using generic scrolling capture");

        // Store original scroll position
        const originalScrollTop = this.scrollContainer.scrollTop;

        // Get scroll metrics
        const scrollHeight = this.scrollContainer.scrollHeight;
        const clientHeight = this.scrollContainer.clientHeight;
        const maxPosition = scrollHeight - clientHeight;

        console.log(
          `DocumentReader: Scroll height ${scrollHeight}, client height ${clientHeight}`
        );

        // Scroll to top
        await this.scrollTo(0);

        // Get content at different scroll positions
        let allLines: string[] = [];
        const visibleContent = this.getVisibleContent();
        allLines = visibleContent.split("\n");

        // Scroll and capture
        const stepSize = Math.floor(clientHeight * 0.7); // 70% overlap
        let position = stepSize;

        while (position < maxPosition) {
          await this.scrollTo(position);

          const visibleContent = this.getVisibleContent();
          const visibleLines = visibleContent.split("\n");

          // Try to find overlap
          let overlapFound = false;
          for (let i = 10; i > 0; i--) {
            if (allLines.length >= i) {
              const lastLines = allLines.slice(-i);
              const firstLines = visibleLines.slice(0, i);

              if (
                lastLines.every((line, index) => line === firstLines[index])
              ) {
                // Found overlap, add only new lines
                allLines = allLines.concat(visibleLines.slice(i));
                overlapFound = true;
                console.log(
                  `DocumentReader: Found ${i} lines overlap at position ${position}`
                );
                break;
              }
            }
          }

          // If no overlap found, just append all
          if (!overlapFound) {
            console.log(
              `DocumentReader: No overlap found at position ${position}, adding all lines`
            );
            allLines = allLines.concat(visibleLines);
          }

          position += stepSize;
          if (position > maxPosition) {
            position = maxPosition;
          }
        }

        // Restore scroll position
        this.scrollContainer.scrollTop = originalScrollTop;

        // Join all lines
        const content = allLines.join("\n");
        console.log(
          `DocumentReader: Assembled document of ${allLines.length} lines`
        );

        this.documentCache = content;
        return content;
      }

      // Method 4: Ask user to copy
      return await this.askUserToCopy();
    } catch (error) {
      console.error("DocumentReader: Error during capture:", error);
      return this.documentCache || "";
    } finally {
      this.isCapturing = false;
    }
  }

  // Ask the user to manually copy content
  private async askUserToCopy(): Promise<string> {
    console.log("DocumentReader: Asking user to manually copy content");

    const editorContainer =
      this.editor?.closest(
        ".editor-container, #editor-container, .CodeMirror"
      ) || this.editor;
    if (editorContainer) {
      // Highlight the editor
      const originalBorder =
        editorContainer instanceof HTMLElement
          ? editorContainer.style.border
          : "";
      if (editorContainer instanceof HTMLElement) {
        editorContainer.style.border = "2px solid red";
      }

      // Clear the textarea
      if (this.tempTextArea) {
        this.tempTextArea.value = "";
      }

      // Show alert to user
      alert(
        "Please select all text in the editor (click in editor and press Ctrl+A), then copy it (Ctrl+C), then click OK"
      );

      // Restore original styling
      if (editorContainer instanceof HTMLElement) {
        editorContainer.style.border = originalBorder;
      }

      // Focus the hidden textarea
      if (this.tempTextArea) {
        this.tempTextArea.focus();

        // Ask user to paste
        alert("Now please paste the text (Ctrl+V) and click OK");

        // Get the pasted content
        const pastedContent = this.tempTextArea.value;
        console.log(
          `DocumentReader: Got manually pasted content, length: ${pastedContent.length}`
        );
        return pastedContent;
      }
    }

    return "";
  }

  // Read the document (either from cache or by capturing)
  async readDocument(forceCapture: boolean = false): Promise<DocumentContent> {
    if (forceCapture || !this.documentCache) {
      const text = await this.captureFullDocument();
      // Clean duplicated content
      const cleanedText = this.cleanDuplicatedContent(text);

      console.log(
        `DocumentReader: Original length: ${text.length}, cleaned length: ${cleanedText.length}`
      );
      const content: DocumentContent = {
        rawText: cleanedText,
        timestamp: Date.now(),
      };

      if (text && text.length > 0) {
        this.lastContent = content;
      }

      return content;
    } else {
      return {
        rawText: this.documentCache,
        timestamp: Date.now(),
      };
    }
  }

  // Handle document change events
  private handleDocumentChange(): void {
    // Clear the cache when the document changes
    this.documentCache = null;
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

  // Get cursor position if possible
  getCursorPosition(): { line: number; character: number } | null {
    // Try CodeMirror API
    if (
      this.codeMirrorInstance &&
      typeof this.codeMirrorInstance.getCursor === "function"
    ) {
      try {
        const cursor = this.codeMirrorInstance.getCursor();
        return { line: cursor.line, character: cursor.ch };
      } catch (err) {
        console.warn(
          "DocumentReader: Error getting cursor position via CodeMirror",
          err
        );
      }
    }

    // Fallback to selection API
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range) {
          // Simple implementation - just counts newlines before cursor
          const preContent = range.startContainer.textContent || "";
          const lines = preContent.split("\n");
          return {
            line: lines.length - 1,
            character: lines[lines.length - 1].length,
          };
        }
      }
    } catch (error) {
      console.error("Error getting cursor position:", error);
    }

    // Default fallback position
    return { line: 0, character: 0 };
  }
}

// Create and export a singleton instance
const DocumentReaderInstance = new DocumentReader();
export default DocumentReaderInstance;
