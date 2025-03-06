import React from "react";
import ReactDOM from "react-dom";

export function ShadowDom({
  parentElement,
  //parentElement,
  position = "beforeend",
  children,
}: {
  parentElement: Element;
  position?: InsertPosition;
  children: React.ReactNode;
}) {
  const [shadowHost] = React.useState(() => {
    const host = document.createElement("my-shadow-host");
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.right = "0";
    host.style.zIndex = "9999";
    host.style.backgroundColor = "red";
    host.style.width = "200px";
    host.style.height = "100px";
    // Optional: set width/height or other styling if needed
    return host;
  });

  /*
  const [shadowHost] = React.useState(() =>
    document.createElement("my-shadow-host")
  );
  */

  const [shadowRoot] = React.useState(
    () => shadowHost.attachShadow({ mode: "open" }) // set to open for debugging
  );

  React.useLayoutEffect(() => {
    if (parentElement) {
      console.log("Inserting shadow host into parent:", parentElement);
      parentElement.insertAdjacentElement(position, shadowHost);

      // Inject the stylesheet for Tailwind/shadcn components
      const linkElem = document.createElement("link");
      linkElem.setAttribute("rel", "stylesheet");
      // Use chrome.runtime.getURL to reference the CSS file in your extension:
      linkElem.setAttribute("href", chrome.runtime.getURL("index.css"));
      shadowRoot.appendChild(linkElem);
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
