// ShadowDom.tsx
import React from "react";
import ReactDOM from "react-dom";
import { baseStyles } from "./shadowdomstyles"; // Import the styles

export function ShadowDom({
  parentElement,
  position = "beforeend",
  children,
  styles, // Accept styles as a prop
}: {
  parentElement: Element;
  position?: InsertPosition;
  children: React.ReactNode;
  styles?: string; // CSS as a string
  sidebarWidth?: number;
}) {
  const [shadowHost] = React.useState(() => {
    console.log("Creating shadow host element");
    const host = document.createElement("my-shadow-host");

    // Changed from fixed positioning to absolute
    host.style.position = "absolute";
    host.style.top = "0"; // Align to top of parent
    host.style.right = "0px"; // Align to right of parent
    host.style.height = "100%"; // Take full height of parent
    host.style.zIndex = "100"; // Lower z-index so it won't overlay important UI elements
    host.style.overflow = "visible";
    host.style.border = "2px solid red"; // Keep for debugging
    host.style.backgroundColor = "white"; // Add background so content is visible

    return host;
  });

  const [shadowRoot] = React.useState(() => {
    console.log("Attaching shadow root");
    return shadowHost.attachShadow({ mode: "open" });
  });

  React.useLayoutEffect(() => {
    if (parentElement) {
      console.log("Inserting shadow host into parent:", parentElement);
      parentElement.insertAdjacentElement(position, shadowHost);

      // Add padding to the parent element to make room for our sidebar
      if (parentElement instanceof HTMLElement) {
        const originalPaddingRight = parentElement.style.paddingRight;
        const originalPosition = parentElement.style.position;

        // Make sure the parent has relative positioning for absolute positioning context
        if (
          parentElement.style.position !== "absolute" &&
          parentElement.style.position !== "fixed"
        ) {
          parentElement.style.position = "relative";
        }

        // Add padding to push content aside
        parentElement.style.paddingRight = "300px";

        // Store original values to restore on cleanup
        shadowHost.dataset.originalPaddingRight = originalPaddingRight;
        shadowHost.dataset.originalPosition = originalPosition;
      }

      // Create and add the base style element using imported styles
      const baseStyleElement = document.createElement("style");
      baseStyleElement.textContent = baseStyles;
      shadowRoot.appendChild(baseStyleElement);

      // Rest of your existing code for styles...
      if (styles) {
        const tailwindStyleElement = document.createElement("style");
        tailwindStyleElement.textContent = styles;
        shadowRoot.appendChild(tailwindStyleElement);
      }

      // Fallback styles loading...
      try {
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", chrome.runtime.getURL("index.css"));
        shadowRoot.appendChild(linkElem);
      } catch (linkError) {
        console.error("Error adding link element:", linkError);
      }
    }

    return () => {
      // Restore original parent styles on cleanup
      if (parentElement instanceof HTMLElement) {
        if (shadowHost.dataset.originalPaddingRight) {
          parentElement.style.paddingRight =
            shadowHost.dataset.originalPaddingRight;
        }
        if (shadowHost.dataset.originalPosition) {
          parentElement.style.position = shadowHost.dataset.originalPosition;
        }
      }

      // Remove the shadow host
      console.log("Cleanup: Removing shadow host");
      shadowHost.remove();
    };
  }, [parentElement, shadowHost, position, shadowRoot, styles]);

  // Log rendering
  console.log("Rendering children into shadow DOM");
  return ReactDOM.createPortal(children, shadowRoot);
}
