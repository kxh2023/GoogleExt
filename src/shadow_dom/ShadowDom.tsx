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
}) {
  const [shadowHost] = React.useState(() => {
    console.log("Creating shadow host element");
    const host = document.createElement("my-shadow-host");
    // Important: Set position to fixed and make sure it doesn't cover the whole page
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.right = "0";
    host.style.bottom = "0"; // Make it full height
    host.style.width = "auto"; // Let the content determine width
    host.style.zIndex = "9999";
    host.style.overflow = "visible"; // Ensure content doesn't get cut off
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

      // Create and add the base style element using imported styles
      const baseStyleElement = document.createElement("style");
      baseStyleElement.textContent = baseStyles;
      shadowRoot.appendChild(baseStyleElement);
      console.log("Base styles added to shadow DOM");

      // Add tailwind styles if provided
      if (styles) {
        console.log("Inline styles provided, length:", styles.length);
        const tailwindStyleElement = document.createElement("style");
        tailwindStyleElement.textContent = styles;
        shadowRoot.appendChild(tailwindStyleElement);
        console.log("Tailwind styles added to shadow DOM");
      }

      // As a fallback, also load styles via link
      try {
        console.log("Adding link element as fallback");
        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", chrome.runtime.getURL("index.css"));
        shadowRoot.appendChild(linkElem);
        console.log("Link element added");
      } catch (linkError) {
        console.error("Error adding link element:", linkError);
      }

      // Add debugging element to check if shadow DOM is working
      const debugElement = document.createElement("div");
      debugElement.textContent = "Shadow DOM Loaded";
      debugElement.style.cssText =
        "position: absolute; top: 0; left: -150px; background: gray; color: white; padding: 5px; font-size: 12px; z-index: 10000; opacity: 0.7;";
      shadowRoot.appendChild(debugElement);
    }

    return () => {
      console.log("Cleanup: Removing shadow host");
      shadowHost.remove();
    };
  }, [parentElement, shadowHost, position, shadowRoot, styles]);

  // Log rendering
  console.log("Rendering children into shadow DOM");
  return ReactDOM.createPortal(children, shadowRoot);
}
