// DocumentSender.tsx - Component for sending document content to ShadowDom
import React, { useEffect, useState } from "react";
import DocumentReaderInstance, { DocumentContent } from "./DocumentReader";

// Props interface for DocumentSender
interface DocumentSenderProps {
  // Callback to send content to parent/ShadowDom
  onContentUpdate: (content: DocumentContent) => void;

  // Optional polling interval in milliseconds
  pollingInterval?: number;

  // Optional flag to enable/disable automatic updates
  autoUpdate?: boolean;

  // Optional custom editor selector
  editorSelector?: string;
}

/**
 * DocumentSender component
 *
 * This component serves as a bridge between the DocumentReader and ShadowDom.
 * It initializes the document reader, monitors for changes, and sends content
 * to the parent component where it can be processed.
 */
const DocumentSender: React.FC<DocumentSenderProps> = ({
  onContentUpdate,
  pollingInterval = 500,
  autoUpdate = true,
  editorSelector = ".cm-content",
}) => {
  // Track initialization status
  const [initialized, setInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize document reader and set up listeners
  useEffect(() => {
    if (initialized) return;

    try {
      // Initialize document reader
      const success = DocumentReaderInstance.initialize(editorSelector);

      if (!success) {
        setError(
          `Failed to initialize document reader with selector: ${editorSelector}`
        );
        return;
      }

      // Get initial content
      const initialContent = DocumentReaderInstance.getCurrentContent();
      if (initialContent) {
        onContentUpdate(initialContent);
      }

      // Set up listener for document changes if auto-update is enabled
      let unsubscribe: (() => void) | null = null;

      if (autoUpdate) {
        unsubscribe = DocumentReaderInstance.onDocumentChange((content) => {
          onContentUpdate(content);
        });
      }

      setInitialized(true);

      // Clean up listener when component unmounts
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (err) {
      setError(
        `Error initializing document reader: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }, [initialized, onContentUpdate, autoUpdate, editorSelector]);

  // Set up manual polling if needed and auto-update is disabled
  useEffect(() => {
    if (!initialized || autoUpdate || pollingInterval <= 0) return;

    const intervalId = setInterval(() => {
      try {
        const content = DocumentReaderInstance.readDocument();
        onContentUpdate(content);
      } catch (err) {
        console.error("Error reading document:", err);
      }
    }, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [initialized, autoUpdate, pollingInterval, onContentUpdate]);

  // Manual refresh function that can be called from parent
  const refreshContent = () => {
    if (!initialized) return null;

    try {
      const content = DocumentReaderInstance.readDocument();
      onContentUpdate(content);
      return content;
    } catch (err) {
      console.error("Error refreshing content:", err);
      return null;
    }
  };

  // Expose refreshContent function to parent component
  React.useImperativeHandle(React.createRef(), () => ({
    refreshContent,
  }));

  // This component doesn't render anything visible
  // It just serves as a bridge between the document reader and the parent
  return (
    <>
      {error && (
        <div style={{ display: "none" }} data-error={error}>
          {error}
        </div>
      )}
    </>
  );
};

export default DocumentSender;
