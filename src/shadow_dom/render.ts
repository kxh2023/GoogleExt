import { createRoot } from "react-dom/client";

export function render(content: React.ReactElement) {
  // Create a container element and append it to the body
  const container = document.createElement("div");
  document.body.appendChild(container);

  // Create a React root on the container and render your app
  const root = createRoot(container);
  root.render(content);
}
