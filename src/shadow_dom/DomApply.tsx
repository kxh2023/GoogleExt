import React, { useEffect, useState, useRef } from "react";
import { ShadowDom } from "./ShadowDom";
import App from "../App.tsx";

export function DomApply(): React.ReactElement | null {
  const [parentElement] = React.useState(() =>
    document.getElementById("ide-root")
  );
  const [sidebarWidth, setSidebarWidth] = useState(300); // Default width
  const isDraggingRef = useRef(false);
  const initialXRef = useRef(0);
  const initialWidthRef = useRef(0);

  // Use useEffect to modify the parent layout
  useEffect(() => {
    if (parentElement) {
      const originalDisplay = parentElement.style.display;
      const originalPadding = parentElement.style.paddingRight;

      parentElement.style.position = "relative";
      parentElement.style.paddingRight = `${sidebarWidth + 20}px`; // Dynamic padding based on width

      return () => {
        parentElement.style.display = originalDisplay;
        parentElement.style.paddingRight = originalPadding;
      };
    }
  }, [parentElement, sidebarWidth]); // Add sidebarWidth as dependency

  // Handle dragging for resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = initialXRef.current - e.clientX;
        const newWidth = Math.max(
          200,
          Math.min(600, initialWidthRef.current + deltaX)
        );
        setSidebarWidth(newWidth);

        if (parentElement) {
          parentElement.style.paddingRight = `${newWidth + 20}px`;
        }
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = "";
    };

    // Add event listeners to document to capture mouse events even outside Shadow DOM
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [parentElement, sidebarWidth]);

  // This is the mouse down handler
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    initialXRef.current = e.clientX;
    initialWidthRef.current = sidebarWidth;
    document.body.style.userSelect = "none"; // Prevent text selection during resize
  };

  return parentElement ? (
    <ShadowDom parentElement={parentElement} sidebarWidth={sidebarWidth}>
      <div
        style={{
          position: "relative", // Changed from absolute
          width: `${sidebarWidth}px`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
          overflow: "auto", // Changed from hidden to auto to enable scrolling
          border: "1px solid #ccc",
        }}
      >
        {/* Fixed position resize handle that won't move */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "fixed", // Changed from absolute to fixed
            left: `${
              parentElement?.getBoundingClientRect().right - sidebarWidth - 5
            }px`, // Position it at the left edge of sidebar
            top: "0",
            width: "10px", // Wider for easier grabbing
            height: "100%",
            cursor: "ew-resize",
            backgroundColor: "rgba(0, 0, 0, 0.1)", // Slightly visible
            zIndex: 1001, // Higher z-index to ensure it's above other elements
          }}
        />

        {/* Add a margin to prevent content from being under the resize handle */}
        <div
          style={{
            marginLeft: "10px",
            width: "calc(100% - 10px)",
            height: "100%",
            overflow: "auto",
          }}
        >
          <App />
        </div>
      </div>
    </ShadowDom>
  ) : (
    <div>Error: Parent element not found</div>
  );
}
