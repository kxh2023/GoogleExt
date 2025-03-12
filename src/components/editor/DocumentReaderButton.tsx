// LatexPrintButton.tsx - Extremely simplified version
import React, { useState, useEffect } from "react";
import DocumentReaderInstance from "./DocumentReader";
import DocumentCacheInstance from "./DocumentCache";
import { Button } from "../ui/button";
import CursorContextButton from "./CursorContextButton";

const LatexPrintButton: React.FC = () => {
  const [isReaderInitialized, setIsReaderInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasFullDocument, setHasFullDocument] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  useEffect(() => {
    // Try to initialize the document reader
    const readerInitialized = DocumentReaderInstance.initialize();
    setIsReaderInitialized(readerInitialized);

    if (!readerInitialized) {
      addDebugMessage("Failed to initialize document reader");

      // If initialization failed, retry after a delay
      const initTimer = setTimeout(() => {
        const retryReaderInitialized = DocumentReaderInstance.initialize();
        setIsReaderInitialized(retryReaderInitialized);

        if (retryReaderInitialized) {
          addDebugMessage("Successfully initialized document reader on retry");
        } else {
          addDebugMessage("Failed to initialize document reader after retry");
        }
      }, 3000);

      return () => clearTimeout(initTimer);
    } else {
      addDebugMessage("Successfully initialized document reader");
    }

    // Check if we already have a cache
    setHasFullDocument(DocumentCacheInstance.hasCache());

    // Listen for cache changes
    const unsubscribe = DocumentCacheInstance.onCacheChange(() => {
      setHasFullDocument(true);
      addDebugMessage("Document cache updated");
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const addDebugMessage = (message: string) => {
    setDebugLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
    console.log(`PrintButton: ${message}`);
  };

  const handlePrintLatex = async () => {
    try {
      setIsCapturing(true);
      addDebugMessage("Starting document capture");

      // Capture the document
      const content = await DocumentReaderInstance.readDocument(true);

      // Update the cache with the captured document
      if (content.rawText) {
        DocumentCacheInstance.updateFullCache(content);
        addDebugMessage(
          `Captured document - length: ${content.rawText.length} characters`
        );
        setHasFullDocument(true);

        // Print the LaTeX source to the console
        console.log("========== LATEX SOURCE (Captured) ==========");
        console.log(content.rawText);
        console.log("=============================================");

        // Show preview in debug log
        const preview =
          content.rawText.length > 100
            ? content.rawText.substring(0, 100) + "..."
            : content.rawText;
        addDebugMessage(`Content preview: ${preview}`);
      } else {
        addDebugMessage("Failed to capture document - empty content");
        alert(
          "Could not capture document content. Try again or check console for errors."
        );
      }
    } catch (error) {
      console.error("Error capturing LaTeX:", error);
      addDebugMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      alert("Error capturing document. See console for details.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClearCache = () => {
    DocumentCacheInstance.clearCache();
    setHasFullDocument(false);
    addDebugMessage("Cache cleared");
  };

  const getButtonText = () => {
    if (isCapturing) {
      return "Capturing...";
    }
    if (hasFullDocument) {
      return "Print LaTeX (Cached)";
    }
    return "Print LaTeX";
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      <Button
        onClick={handlePrintLatex}
        disabled={!isReaderInitialized || isCapturing}
        variant={isReaderInitialized ? "default" : "secondary"}
        size="sm"
        className="shadow-lg"
      >
        {getButtonText()}
      </Button>

      {hasFullDocument && (
        <Button
          onClick={handleClearCache}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          Clear Cache
        </Button>
      )}

      <CursorContextButton />

      {/* Debug Panel */}
      <div className="mt-2 p-2 bg-gray-100 rounded shadow-lg text-xs max-h-60 overflow-y-auto w-80">
        <h4 className="font-bold mb-1">Debug Log:</h4>
        <ul className="list-none">
          {debugLog.map((msg, i) => (
            <li key={i} className="text-gray-800 mb-1">
              {msg}
            </li>
          ))}
          {debugLog.length === 0 && (
            <li className="text-gray-500">No logs yet</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default LatexPrintButton;
