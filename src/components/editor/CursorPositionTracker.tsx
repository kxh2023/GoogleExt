import DocumentReaderInstance from "./DocumentReader";

export interface CursorPosition {
  line: number;
  character: number;
}

class CursorPositionTracker {
  // Reference to the CodeMirror instance
  private codeMirrorInstance: any = null;

  // Default position when no cursor is found
  private defaultPosition: CursorPosition = { line: 0, character: 0 };

  constructor() {
    // We deliberately don't initialize here - call initialize() explicitly
  }

  // Initialize with the CodeMirror instance from DocumentReader
  initialize(): boolean {
    this.codeMirrorInstance = DocumentReaderInstance.getCodeMirrorInstance();

    if (this.codeMirrorInstance) {
      console.log("CursorTracker: Successfully obtained CodeMirror instance");
      return true;
    } else {
      console.warn(
        "CursorTracker: Failed to get CodeMirror instance - cursor tracking will not work"
      );
      return false;
    }
  }

  // Get the current cursor position from CodeMirror
  getCursorPosition(): CursorPosition {
    try {
      // Try to initialize if not already done
      if (!this.codeMirrorInstance) {
        this.initialize();
      }

      // Method 1: For CodeMirror 6 using state.selection (as suggested in the forum post)
      if (this.codeMirrorInstance && this.codeMirrorInstance.state) {
        try {
          // Try the view.state.selection method for CM6
          const selection = this.codeMirrorInstance.state.selection;
          if (selection) {
            // Get the main selection head (cursor position)
            const head = selection.main?.head;
            if (typeof head === "number") {
              // Convert position to line and character
              const line = this.codeMirrorInstance.lineBlockAt(head);
              if (line) {
                const lineNumber = line.number - 1; // Convert to 0-based indexing
                const character = head - line.from;

                console.log(
                  `CursorTracker: Got position via state.selection - Line ${lineNumber}, Character ${character}`
                );
                return {
                  line: lineNumber,
                  character: character,
                };
              }
            }
          }
        } catch (err) {
          console.warn(
            "CursorTracker: Error accessing view.state.selection",
            err
          );
        }

        // Alternative way to access selection for CM6
        try {
          const view = this.codeMirrorInstance;
          const mainSelection = view.state.selection.main;
          const head = mainSelection.head;

          // Get line information
          const line = view.state.doc.lineAt(head);
          const lineNumber = line.number - 1; // Convert to 0-based indexing
          const character = head - line.from;

          console.log(
            `CursorTracker: Got position via state.selection.main - Line ${lineNumber}, Character ${character}`
          );
          return {
            line: lineNumber,
            character: character,
          };
        } catch (err) {
          console.warn(
            "CursorTracker: Error with alternative CM6 approach",
            err
          );
        }
      }

      // Method 2: For CodeMirror 5 using getCursor
      if (
        this.codeMirrorInstance &&
        typeof this.codeMirrorInstance.getCursor === "function"
      ) {
        try {
          const cursor = this.codeMirrorInstance.getCursor();
          if (
            cursor &&
            typeof cursor.line === "number" &&
            typeof cursor.ch === "number"
          ) {
            console.log(
              `CursorTracker: Position via getCursor - Line ${cursor.line}, Character ${cursor.ch}`
            );
            return { line: cursor.line, character: cursor.ch };
          } else {
            console.warn(
              "CursorTracker: Got invalid cursor from CodeMirror",
              cursor
            );
          }
        } catch (err) {
          console.warn(
            "CursorTracker: Error getting cursor position via getCursor",
            err
          );
        }
      }

      // Method 3: Try using editor's view object
      if (this.codeMirrorInstance && this.codeMirrorInstance.view) {
        try {
          const view = this.codeMirrorInstance.view;
          if (view.state && view.state.selection) {
            const head = view.state.selection.main.head;
            const line = view.state.doc.lineAt(head);
            const lineNumber = line.number - 1; // Convert to 0-based
            const character = head - line.from;

            console.log(
              `CursorTracker: Got position via view.state - Line ${lineNumber}, Character ${character}`
            );
            return {
              line: lineNumber,
              character: character,
            };
          }
        } catch (err) {
          console.warn("CursorTracker: Error accessing view.state", err);
        }
      }

      // If all methods fail, return default position
      console.warn(
        "CursorTracker: All methods failed, returning default position"
      );
      return this.defaultPosition;
    } catch (error) {
      console.error("CursorTracker: Error getting cursor position:", error);
      return this.defaultPosition;
    }
  }

  // Get the CodeMirror instance
  getCodeMirrorInstance(): any {
    return this.codeMirrorInstance;
  }
}

// Create singleton instance
const CursorPositionTrackerInstance = new CursorPositionTracker();
export default CursorPositionTrackerInstance;
