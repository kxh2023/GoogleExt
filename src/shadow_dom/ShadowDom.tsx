import React from "react";
import ReactDOM from "react-dom";

export function ShadowDom({
  parentElement,
  position = "beforeend",
  children,
}: {
  parentElement: Element;
  position?: InsertPosition;
  children: React.ReactNode;
}) {
  const [shadowHost] = React.useState(() => {
    const host = document.createElement("my-shadow-host");
    // Remove the explicit styling that makes it a red square
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.right = "0";
    host.style.zIndex = "9999";
    // Removed background-color: red
    // Let the child components control their own dimensions
    return host;
  });

  const [shadowRoot] = React.useState(() =>
    shadowHost.attachShadow({ mode: "open" })
  );

  React.useLayoutEffect(() => {
    if (parentElement) {
      console.log("Inserting shadow host into parent:", parentElement);
      parentElement.insertAdjacentElement(position, shadowHost);

      // Create a container for styles
      const styleContainer = document.createElement("div");
      shadowRoot.appendChild(styleContainer);

      // Inject Tailwind styles
      const linkElem = document.createElement("link");
      linkElem.setAttribute("rel", "stylesheet");
      linkElem.setAttribute("href", chrome.runtime.getURL("index.css"));
      styleContainer.appendChild(linkElem);

      // Add an additional style element for any Shadow DOM specific styles
      const styleElem = document.createElement("style");
      styleElem.textContent = `
        /* Reset some basics for Shadow DOM */
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        /* Allow Tailwind to work properly in Shadow DOM */
        * {
          box-sizing: border-box;
        }
      `;
      styleContainer.appendChild(styleElem);
    } else {
      console.error("Parent element not found!");
    }

    return () => {
      console.log("Removing shadow host");
      shadowHost.remove();
    };
  }, [parentElement, shadowHost, position, shadowRoot]);

  return ReactDOM.createPortal(children, shadowRoot);
}
