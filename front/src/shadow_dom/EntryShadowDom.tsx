import { ShadowDom } from "./ShadowDom";
import { ChatPanel } from "../components/chatpanel/ChatPanel";

export function createShadowDomContainer(): HTMLDivElement {
  console.log("Creating container for ShadowDOM");

  // First, add margin to the body to make space for our sidebar
  const sidebarWidth = "300px";
  document.body.style.marginRight = sidebarWidth;
  document.body.style.transition = "margin-right 0.3s ease";

  // Create the container
  const container = document.createElement("div");
  container.id = "overreleaf-extension-root";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.right = "0";
  container.style.width = sidebarWidth;
  container.style.height = "100vh";
  container.style.zIndex = "100";
  container.style.backgroundColor = "white";
  container.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.1)";
  container.style.overflow = "hidden";
  container.style.transition = "width 0.3s ease";
  container.style.padding = "0";
  container.style.boxSizing = "border-box";

  // Create inner container for content (with padding and scrolling)
  const innerContainer = document.createElement("div");
  innerContainer.style.width = "100%";
  innerContainer.style.height = "100%";
  innerContainer.style.overflowY = "auto";
  innerContainer.style.padding = "10px";
  innerContainer.style.boxSizing = "border-box";
  innerContainer.style.paddingLeft = "15px";

  // Add resize handle with better visibility
  const resizeHandle = document.createElement("div");
  resizeHandle.style.position = "absolute";
  resizeHandle.style.top = "0";
  resizeHandle.style.left = "0";
  resizeHandle.style.width = "8px";
  resizeHandle.style.height = "100%";
  resizeHandle.style.cursor = "ew-resize";
  resizeHandle.style.backgroundColor = "#e0e0e0";
  resizeHandle.style.borderRight = "1px solid #ccc";
  resizeHandle.style.zIndex = "101";

  // Add hover effect to make handle more noticeable
  resizeHandle.addEventListener("mouseover", () => {
    resizeHandle.style.backgroundColor = "#c0c0c0";
  });

  resizeHandle.addEventListener("mouseout", () => {
    resizeHandle.style.backgroundColor = "#e0e0e0";
  });

  // Add the components in proper order
  container.appendChild(resizeHandle);
  container.appendChild(innerContainer);

  // Add the container to the body
  document.body.appendChild(container);
  console.log("Container added to body:", container);

  // Optional: Add resize functionality
  let isResizing = false;
  let initialX = 0;
  let initialWidth = 0;

  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    initialX = e.clientX;
    initialWidth = parseInt(container.style.width, 10);
    document.body.style.userSelect = "none";
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const width = initialWidth - (e.clientX - initialX);
    if (width > 100 && width < 500) {
      container.style.width = width + "px";
      document.body.style.marginRight = width + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.userSelect = "";
  });

  return innerContainer;
}

export function renderShadowDom(container: HTMLDivElement, render: any) {
  console.log("Rendering ShadowDOM and ChatPanel");

  render(
    <ShadowDom parentElement={container} position="beforeend">
      <ChatPanel userName="kxh2023" />
    </ShadowDom>
  );
  console.log("ShadowDOM rendering completed");
}
