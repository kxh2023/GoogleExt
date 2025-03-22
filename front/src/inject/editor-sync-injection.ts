import {
  createEditorSyncService,
  EditorSyncService,
} from "../services/EditorSyncService";

declare global {
  interface Window {
    _cmView: any;
    _editorSyncService: EditorSyncService;
  }
}

(function setupEditorSync() {
  console.log("EditorSync: Starting setup");

  // Function to extract document ID from URL
  function getDocumentIdFromUrl(): string {
    // Overleaf URL pattern: https://www.overleaf.com/project/[projectId]
    const matches = window.location.pathname.match(/\/project\/([a-zA-Z0-9]+)/);
    if (matches && matches.length > 1) {
      return matches[1];
    }
    return "unknown-document";
  }

  // Function to initialize sync service once CM is available
  function initializeSyncService() {
    if (!window._cmView) {
      console.log("EditorSync: CodeMirror view not yet available");
      return false;
    }

    try {
      const documentId = getDocumentIdFromUrl();
      console.log(`EditorSync: Initializing for document ${documentId}`);

      // Create and initialize the service
      const syncService = createEditorSyncService(documentId);
      const success = syncService.initialize(window._cmView);

      if (success) {
        window._editorSyncService = syncService;
        console.log("EditorSync: Successfully initialized");
        return true;
      }
    } catch (error) {
      console.error("EditorSync: Error initializing", error);
    }

    return false;
  }

  // Try to initialize right away if CM is already available
  if (window._cmView) {
    initializeSyncService();
  }

  // Otherwise, listen for CM initialization
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "CODEMIRROR_INSTANCE_FOUND") {
      console.log("EditorSync: CodeMirror instance found, initializing sync");
      setTimeout(initializeSyncService, 500); // Give a small delay to ensure CM is fully initialized
    }
  });

  // Cleanup on page unload
  window.addEventListener("unload", () => {
    if (window._editorSyncService) {
      window._editorSyncService.dispose();
    }
  });
})();
