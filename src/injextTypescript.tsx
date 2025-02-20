// injectApp.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import SideBar from "./components/SidePanel";
// Import your Tailwind CSS as an inline string (Vite supports this with the ?inline query)
import tailwindStyles from "./tailwind.css?inline";

(() => {
  console.log("injectApp called");

  // Locate the parent container; use an element with a specific ID if available, otherwise default to document.body.
  const parentContainer =
    document.getElementById("panel-outer-main") || document.body;

  // Ensure the parent container uses a flex layout so the injected component can push content aside.
  const computedStyle = window.getComputedStyle(parentContainer);
  if (computedStyle.display !== "flex") {
    parentContainer.style.display = "flex";
    parentContainer.style.flexDirection = "row";
  }

  // Create a container for the injection
  const injectionContainer = document.createElement("div");
  injectionContainer.id = "my-injected-component-container";
  parentContainer.appendChild(injectionContainer);

  // Attach a Shadow DOM to encapsulate our styles and markup
  const shadowRoot = injectionContainer.attachShadow({ mode: "open" });

  // Inject Tailwind CSS into the Shadow DOM so our component's styles apply
  const styleEl = document.createElement("style");
  styleEl.textContent = tailwindStyles;
  shadowRoot.appendChild(styleEl);

  // Create a mount point for our React component inside the Shadow DOM
  const mountPoint = document.createElement("div");
  mountPoint.style.width = "100%";
  mountPoint.style.height = "100%";
  shadowRoot.appendChild(mountPoint);

  // Use ReactDOM to mount the external component into the mount point
  const root = ReactDOM.createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <SideBar />
    </React.StrictMode>
  );
})();
