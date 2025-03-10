// LatexPrintButton.tsx
import React, { useState, useEffect } from "react";
import DocumentReaderInstance from "./DocumentReader";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const LatexPrintButton: React.FC = () => {
  const [isReaderInitialized, setIsReaderInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasFullDocument, setHasFullDocument] = useState(false);

  useEffect(() => {
    // Try to initialize the document reader
    const initialized = DocumentReaderInstance.initialize();
    setIsReaderInitialized(initialized);

    if (!initialized) {
      // If initialization failed, retry after a delay
      const initTimer = setTimeout(() => {
        const retryInitialized = DocumentReaderInstance.initialize();
        setIsReaderInitialized(retryInitialized);
        if (!retryInitialized) {
          console.error("Failed to initialize DocumentReader after retry");
        }
      }, 3000);

      return () => clearTimeout(initTimer);
    }
  }, []);

  const handlePrintLatex = async () => {
    try {
      setIsCapturing(true);

      // If we haven't captured the full document yet, force a capture
      const content = await DocumentReaderInstance.readDocument(
        !hasFullDocument
      );

      // Print the LaTeX source to the console
      console.log("========== LATEX SOURCE ==========");
      console.log(content.latexSource);
      console.log("==================================");

      // Mark that we now have the full document
      setHasFullDocument(true);

      // Show success feedback
      console.log("LaTeX document printed to console");
    } catch (error) {
      console.error("Error printing LaTeX:", error);
      alert("Error capturing document. See console for details.");
    } finally {
      setIsCapturing(false);
    }
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
    <div className="fixed bottom-5 right-5 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handlePrintLatex}
              disabled={!isReaderInitialized || isCapturing}
              variant={isReaderInitialized ? "default" : "secondary"}
              size="sm"
              className="shadow-lg"
            >
              {getButtonText()}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>
              {isCapturing
                ? "Capturing the entire document..."
                : hasFullDocument
                ? "Print the cached LaTeX content to console"
                : "Capture and print the entire LaTeX content"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default LatexPrintButton;
