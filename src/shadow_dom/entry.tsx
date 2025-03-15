// In your entry.tsx
import "../index.css"; // This helps Vite know to include this CSS
import { render } from "./render";
import { ShadowDom } from "./ShadowDom";
import { ChatPanel } from "../components/chatpanel/ChatPanel";

// Function to inject our script
function injectScript(file: string) {
  console.log(`Injecting script: ${file}`);

  try {
    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", chrome.runtime.getURL(file));
    script.onload = () => console.log(`Script ${file} loaded successfully`);
    script.onerror = (e) => console.error(`Script ${file} failed to load:`, e);
    document.documentElement.appendChild(script);
    console.log(`Script ${file} injected into page`);
  } catch (error) {
    console.error(`Error injecting script ${file}:`, error);
  }
}

// Interface for CodeMirror messages
interface CodeMirrorInfo {
  lineNumber: number;
  position: number;
  lineContent: string;
}

interface CodeMirrorMessage {
  type: string;
  info: CodeMirrorInfo;
}

// Function to initialize the extension
async function initialize() {
  console.log("Initializing extension...");

  // Inject our script to access CodeMirror
  injectScript("codemirror-inject.js");

  // Setup message listener before injection to ensure we catch all messages
  console.log("Setting up message listener");
  window.addEventListener(
    "message",
    (event: MessageEvent<CodeMirrorMessage | { type: string }>) => {
      console.log("Message received:", event.data);
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case "CODEMIRROR_INSTANCE_FOUND":
            console.log("CodeMirror instance found and exposed!");
            break;

          case "CODEMIRROR_CURSOR_UPDATE":
            if ("info" in event.data) {
              console.log(
                `Cursor update - Line: ${event.data.info.lineNumber}, Content: "${event.data.info.lineContent}"`
              );
            }
            break;

          case "CODEMIRROR_CHANGE":
            if ("info" in event.data) {
              console.log(
                `Editor changed - Line: ${event.data.info.lineNumber}, Content: "${event.data.info.lineContent}"`
              );
            }
            break;
        }
      }
    }
  );

  // Create and mount your shadow DOM with delay to ensure proper loading
  console.log("Creating container for ShadowDOM");
  const container = document.createElement("div");
  container.id = "overreleaf-extension-root";
  container.style.position = "fixed";
  container.style.right = "0";
  container.style.top = "0";
  container.style.width = "300px";
  container.style.height = "100vh";
  container.style.zIndex = "9999";
  container.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
  container.style.border = "1px solid #ccc";
  document.body.appendChild(container);
  console.log("Container added to body:", container);

  // Small delay to ensure DOM is ready
  setTimeout(() => {
    console.log("Rendering ShadowDOM and ChatPanel");
    render(
      <ShadowDom parentElement={container} position="beforeend">
        <ChatPanel userName="kxh2023" />
      </ShadowDom>
    );
    console.log("ShadowDOM rendering completed");
  }, 500);
}

// Start the initialization with a delay to ensure page is ready
console.log("Content script loaded, waiting for page to be ready");
setTimeout(() => {
  initialize();
}, 1000);
