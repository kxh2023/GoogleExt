// CursorContextCapture.tsx - Tracks cursor position and captures surrounding context
import React, { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import DocumentReaderInstance from "./DocumentReader";
import DocumentCacheInstance from "./DocumentCache";

// Context around cursor for autocomplete
export interface CursorContext {
  cursorPosition: {
    line: number;
    character: number;
  };
  linesBefore: string[]; // Lines before cursor (most recent last)
  currentLine: string; // The line containing the cursor
  linesAfter: string[]; // Lines after cursor (closest first)
  fullRange: {
    // Full range covered by this context
    startLine: number;
    endLine: number;
  };
  timestamp: number;
}

interface Props {
  // Callback to trigger autocomplete with context
  onContextUpdate?: (context: CursorContext) => void;

  // Settings
  beforeLinesCount?: number; // How many lines to capture before cursor
  afterLinesCount?: number; // How many lines to capture after cursor
  updateIntervalMs?: number; // Milliseconds between context updates
  fullRefreshMs?: number; // Milliseconds before triggering a full refresh
}

const CursorContextCapture: React.FC<Props> = ({
  onContextUpdate,
  beforeLinesCount = 10,
  afterLinesCount = 5,
  updateIntervalMs = 1500,
  fullRefreshMs = 30000,
}) => {
  // Track if component is mounted
  const isMounted = useRef(true);

  // Track last known cursor position
  const lastCursorPosition = useRef<{ line: number; character: number } | null>(
    null
  );

  // Track last full refresh time
  const lastFullRefreshTime = useRef<number>(Date.now());

  // Track cursor activity timer
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Track if a capture is in progress
  const isCapturing = useRef<boolean>(false);

  // Debounced context capture function
  const debouncedCaptureContext = useRef(
    debounce(async () => {
      await captureContext();
    }, updateIntervalMs)
  ).current;

  // Setup interval for regular checks
  useEffect(() => {
    // Initial capture
    captureContext(true);

    // Setup interval for periodic checks
    const intervalId = setInterval(() => {
      checkForUpdates();
    }, updateIntervalMs);

    // Handle cursor movements using document events
    const handleCursorActivity = () => {
      // Reset inactivity timer
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      // Setup new inactivity timer for full refresh
      inactivityTimer.current = setTimeout(() => {
        console.log("Cursor inactivity detected, triggering full refresh");
        captureContext(true);
      }, fullRefreshMs);

      // Trigger debounced capture
      debouncedCaptureContext();
    };

    // Add listeners for cursor movement
    document.addEventListener("keyup", handleCursorActivity);
    document.addEventListener("mouseup", handleCursorActivity);
    document.addEventListener("click", handleCursorActivity);

    // Cleanup
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);

      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      debouncedCaptureContext.cancel();

      document.removeEventListener("keyup", handleCursorActivity);
      document.removeEventListener("mouseup", handleCursorActivity);
      document.removeEventListener("click", handleCursorActivity);
    };
  }, [debouncedCaptureContext, fullRefreshMs, updateIntervalMs]);

  // Check if updates are needed based on cursor position or time
  const checkForUpdates = async () => {
    if (isCapturing.current) return;

    // Get current cursor position
    const cursorPosition = DocumentReaderInstance.getCursorPosition();
    if (!cursorPosition) return;

    // Check if cursor moved
    const cursorMoved =
      !lastCursorPosition.current ||
      cursorPosition.line !== lastCursorPosition.current.line ||
      cursorPosition.character !== lastCursorPosition.current.character;

    // Check if full refresh is needed based on time
    const now = Date.now();
    const timeSinceLastFullRefresh = now - lastFullRefreshTime.current;
    const needsFullRefresh = timeSinceLastFullRefresh > fullRefreshMs;

    if (cursorMoved) {
      // Capture context due to cursor movement
      captureContext(needsFullRefresh);
    } else if (needsFullRefresh) {
      // Capture full context due to time threshold
      captureContext(true);
    }
  };

  // Capture context around cursor
  const captureContext = async (forceFullRefresh: boolean = false) => {
    if (isCapturing.current || !isMounted.current) return;

    isCapturing.current = true;

    try {
      // Get current cursor position
      const cursorPosition = DocumentReaderInstance.getCursorPosition();
      if (!cursorPosition) {
        isCapturing.current = false;
        return;
      }

      // Update last known position
      lastCursorPosition.current = { ...cursorPosition };

      // Check if we need a full document refresh
      if (forceFullRefresh || !DocumentCacheInstance.hasCache()) {
        console.log("Capturing full document content");

        // Capture full document
        const documentContent = await DocumentReaderInstance.readDocument(true);

        // Cache was updated as part of readDocument(), no need to update it again

        // Reset last full refresh time
        lastFullRefreshTime.current = Date.now();
      }

      // Get document content from cache
      const cachedContent = DocumentCacheInstance.getCacheAsDocumentContent();
      if (!cachedContent) {
        isCapturing.current = false;
        return;
      }

      // Split into lines for context extraction
      const lines = cachedContent.rawText.split("\n");

      // Calculate range of lines to capture
      const startLine = Math.max(0, cursorPosition.line - beforeLinesCount);
      const endLine = Math.min(
        lines.length - 1,
        cursorPosition.line + afterLinesCount
      );

      // Extract context lines
      const linesBefore = lines.slice(startLine, cursorPosition.line);
      const currentLine = lines[cursorPosition.line] || "";
      const linesAfter = lines.slice(cursorPosition.line + 1, endLine + 1);

      // Create context object
      const context: CursorContext = {
        cursorPosition,
        linesBefore,
        currentLine,
        linesAfter,
        fullRange: {
          startLine,
          endLine,
        },
        timestamp: Date.now(),
      };

      // Log context capture
      console.log(
        `Captured context around line ${cursorPosition.line}, range: ${startLine}-${endLine}`
      );

      // Trigger callback if provided
      if (onContextUpdate) {
        onContextUpdate(context);
      }

      // Also update cache with this context (to ensure it's accurate)
      DocumentCacheInstance.updatePartialCache(
        [...linesBefore, currentLine, ...linesAfter],
        startLine
      );
    } catch (error) {
      console.error("Error capturing cursor context:", error);
    } finally {
      isCapturing.current = false;
    }
  };

  // This component doesn't render anything
  return null;
};

export default CursorContextCapture;
