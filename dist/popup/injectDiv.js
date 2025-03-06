import React from "react";
import 

(() => {
  console.log("injectDiv called");

  // Create your new sidebar element
  const sidebar = document.createElement("div");
  sidebar.innerText = "Hello World";

  // Style the sidebar to have a fixed width and span the parent's full height
  sidebar.style.width = "200px"; // Adjust the width as needed
  sidebar.style.height = "100%"; // Make it span the full height of the parent container
  sidebar.style.backgroundColor = "yellow";
  sidebar.style.borderLeft = "1px solid #000";
  sidebar.style.boxSizing = "border-box";
  sidebar.style.flexShrink = "0"; // Prevent it from shrinking

  // Locate the container where you want to insert the sidebar.
  // For example, you might target an element with id "panel-ide" or "panel-main".
  let container = document.getElementById("panel-outer-main");

  // Fallback to document.body if a specific container isn't found.
  if (!container) {
    container = document.body;
    console.log("container not found");
  }

  // Ensure the container is a flex container so the sidebar pushes content to the left.
  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.display !== "flex") {
    container.style.display = "flex";
    container.style.flexDirection = "row"; // Ensure children are laid out horizontally
  }

  // Append the sidebar as the last child, making it the rightmost element.
  container.appendChild(sidebar);
})();
