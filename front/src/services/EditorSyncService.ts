import { io, Socket } from "socket.io-client";

// Configuration
const BACKEND_URL = "http://localhost:5002";
const UPDATE_INTERVAL = 1000; // Send updates every 1 second
const FULL_SYNC_INTERVAL = 30000; // Full sync every 30 seconds
const RECONNECT_INTERVAL = 3000; // Reconnect attempt interval

export interface EditorChange {
  from: number;
  to: number;
  insert: string;
  cursorPos: number;
}

export interface EditorState {
  documentId: string;
  version: number;
  content: string;
  cursorPosition: number;
}

export class EditorSyncService {
  private socket: Socket | null = null;
  private view: any; // CodeMirror view
  private documentId: string;
  private documentVersion = 0;
  private pendingChanges: EditorChange[] = [];
  private lastFullSyncTime = 0;
  private lastSendTime = 0;
  private updateTimeout: NodeJS.Timeout | null = null;
  private connected = false;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(documentId: string) {
    this.documentId = documentId;
  }

  /**
   * Initialize the service with a CodeMirror view
   */
  public initialize(view: any): boolean {
    if (!view) {
      console.error("EditorSyncService: No valid CodeMirror view provided");
      return false;
    }

    this.view = view;
    this.setupWebSocket();
    this.setupChangeTracking();
    return true;
  }

  /**
   * Set up WebSocket connection to backend
   */
  private setupWebSocket(): void {
    try {
      this.socket = io(BACKEND_URL, {
        reconnection: true,
        reconnectionDelay: RECONNECT_INTERVAL,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on("connect", () => {
        console.log("EditorSyncService: Connected to backend");
        this.connected = true;
        this.connectionAttempts = 0;

        // Register with the document ID
        /*this.socket.emit("register", {
          documentId: this.documentId,
        });*/

        // Send full document immediately after connecting
        this.sendFullDocument();
      });

      this.socket.on("disconnect", () => {
        console.log("EditorSyncService: Disconnected from backend");
        this.connected = false;
      });

      this.socket.on("reconnect_attempt", (attemptNumber: number) => {
        console.log(`EditorSyncService: Reconnect attempt ${attemptNumber}`);
        this.connectionAttempts = attemptNumber;
      });

      this.socket.on("reconnect_failed", () => {
        console.error(
          "EditorSyncService: Failed to reconnect after maximum attempts"
        );
      });

      this.socket.on("suggestion", (data: any) => {
        console.log(
          "EditorSyncService: Received suggestion from backend",
          data
        );
        // Here you would handle the autocomplete suggestions from the backend
        // This could trigger UI updates or pass to a callback
      });
    } catch (error) {
      console.error("EditorSyncService: Error setting up WebSocket", error);
    }
  }

  /**
   * Set up change tracking with CodeMirror
   */
  private setupChangeTracking(): void {
    if (!this.view) return;

    // Proxy the dispatch method to capture all transactions
    this.view.dispatch = new Proxy(this.view.dispatch, {
      apply: (target, thisArg, args) => {
        const transaction = args[0];
        const result = Reflect.apply(target, thisArg, args);

        try {
          // Only process if there are actual changes and we're connected
          if (transaction.changes && !transaction.changes.empty) {
            // Extract change information
            transaction.changes.iterChanges(
              (
                fromA: number,
                toA: number,
                //fromB: number,
                //toB: number,
                inserted: any
              ) => {
                const change: EditorChange = {
                  from: fromA,
                  to: toA,
                  insert: inserted.toString(),
                  cursorPos: this.view.state.selection.main.head,
                };

                this.pendingChanges.push(change);
              }
            );

            // Schedule sending updates if not already scheduled
            if (!this.updateTimeout) {
              this.updateTimeout = setTimeout(
                () => this.sendUpdates(),
                UPDATE_INTERVAL
              );
            }
          }
        } catch (error) {
          console.error(
            "EditorSyncService: Error processing transaction",
            error
          );
        }

        return result;
      },
    });

    // Send initial full document
    this.sendFullDocument();
    console.log(this.lastSendTime);
    console.log(this.connectionAttempts);

    // Set up periodic full sync
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastFullSyncTime > FULL_SYNC_INTERVAL) {
        this.sendFullDocument();
      }
    }, FULL_SYNC_INTERVAL / 3); // Check more frequently than the full sync interval
  }

  /**
   * Send accumulated changes to the backend
   */
  private sendUpdates(): void {
    this.updateTimeout = null;
    const now = Date.now();

    if (!this.connected || !this.socket) {
      console.log("EditorSyncService: Not connected, skipping update");
      return;
    }

    // If changes occurred
    if (this.pendingChanges.length > 0) {
      this.documentVersion++;

      // Send change set
      this.socket.emit("changes", {
        documentId: this.documentId,
        type: "changes",
        version: this.documentVersion,
        changes: this.pendingChanges,
        cursorPosition: this.view.state.selection.main.head,
      });

      console.log(
        `EditorSyncService: Sent ${this.pendingChanges.length} changes, version ${this.documentVersion}`
      );
      this.pendingChanges = [];
    } else {
      // Send heartbeat with cursor position
      this.socket.emit("heartbeat", {
        documentId: this.documentId,
        type: "heartbeat",
        version: this.documentVersion,
        cursorPosition: this.view.state.selection.main.head,
      });

      console.log("EditorSyncService: Sent heartbeat");
    }

    this.lastSendTime = now;
  }

  /**
   * Send the complete document content to the backend
   */
  private sendFullDocument(): void {
    if (!this.connected || !this.socket || !this.view) {
      console.log(
        "EditorSyncService: Not connected or no view, skipping full sync"
      );
      return;
    }

    try {
      this.documentVersion++;
      this.lastFullSyncTime = Date.now();

      // Get current document content
      const content = this.view.state.doc.toString();

      this.socket.emit("fullSync", {
        documentId: this.documentId,
        type: "fullSync",
        version: this.documentVersion,
        content: content,
        cursorPosition: this.view.state.selection.main.head,
      });

      console.log(
        `EditorSyncService: Sent full document (${content.length} chars), version ${this.documentVersion}`
      );
    } catch (error) {
      console.error("EditorSyncService: Error sending full document", error);
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log("EditorSyncService: Disposed");
  }

  /**
   * Request suggestions at the current cursor position
   */
  public requestSuggestions(): void {
    if (!this.connected || !this.socket || !this.view) return;

    const cursorPos = this.view.state.selection.main.head;
    const line = this.view.state.doc.lineAt(cursorPos);

    this.socket.emit("requestSuggestion", {
      documentId: this.documentId,
      position: cursorPos,
      lineNumber: line.number,
      lineText: line.text,
      prefix: line.text.substring(0, cursorPos - line.from),
    });

    console.log("EditorSyncService: Requested suggestions");
  }
}

// Export a factory function for creating new instances
export function createEditorSyncService(documentId: string): EditorSyncService {
  return new EditorSyncService(documentId);
}
