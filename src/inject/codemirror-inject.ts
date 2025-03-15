console.log("Codemirror inject script loaded");

declare global {
  interface Window {
    _cmInstance: any;
    _cmView: any;
  }
}

(function injectCodeMirrorAccess() {
  console.log("Starting CodeMirror detection");

  // Function to find CodeMirror instance using simpler approach
  function findCMInstance() {
    console.log("Trying simplified approach");

    // Try CodeMirror 5 approach first
    try {
      const cm5Element = document.querySelector(".CodeMirror");
      if (cm5Element) {
        // @ts-ignore
        const cm5Instance = cm5Element.CodeMirror;
        if (cm5Instance) {
          console.log("Found CodeMirror 5 instance!");
          return { version: 5, instance: cm5Instance };
        }
      }
    } catch (error) {
      console.log("CodeMirror 5 approach failed:", error);
    }

    // Try CodeMirror 6 approach
    try {
      const cmEditorElement = document.querySelector(".cm-editor");
      if (cmEditorElement) {
        const cmContent = cmEditorElement.querySelector(".cm-content");
        if (cmContent) {
          // @ts-ignore
          const view = cmContent.cmView?.view;
          if (view) {
            console.log("Found CodeMirror 6 instance via cmView property!");
            return { version: 6, instance: view };
          }
        }
      }
    } catch (error) {
      console.log("Direct cmView approach failed:", error);
    }

    // Fallback: Try other methods
    return findCM6InstanceFallback();
  }

  // Fallback methods to find CodeMirror 6
  function findCM6InstanceFallback() {
    console.log("Trying fallback methods for CM6");

    // Try to find via internal properties
    try {
      const cmContent = document.querySelector(".cm-content");
      if (!cmContent) return null;

      // Try to access the internal property
      for (const key in cmContent) {
        if (key.startsWith("__")) {
          // @ts-ignore
          const value = cmContent[key];
          if (value && typeof value === "object" && value.view) {
            console.log("Found CM6 view via internal property:", key);
            return { version: 6, instance: value.view };
          }
        }
      }
    } catch (error) {
      console.log("Internal property approach failed:", error);
    }

    return null;
  }

  // Function to expose CodeMirror instance and start cursor tracking
  function exposeCodeMirror() {
    console.log("Attempting to expose CodeMirror");
    const result = findCMInstance();

    if (!result) {
      console.log("No CodeMirror instance found yet");
      return;
    }

    const { version, instance } = result;

    if (version === 5) {
      window._cmInstance = instance;

      // Set up CM5 cursor logging
      setInterval(() => {
        try {
          const cursor = instance.getCursor();
          const lineContent = instance.getLine(cursor.line);
          console.log(
            `CM5 Cursor at line: ${cursor.line + 1}, position: ${cursor.ch}`
          );

          window.postMessage(
            {
              type: "CODEMIRROR_CURSOR_UPDATE",
              info: {
                lineNumber: cursor.line + 1,
                position: cursor.ch,
                lineContent: lineContent,
              },
            },
            "*"
          );
        } catch (error) {
          console.error("Error in CM5 cursor tracking:", error);
        }
      }, 2000);
    } else if (version === 6) {
      window._cmView = instance;

      // Set up CM6 cursor logging
      setInterval(() => {
        try {
          const cursorPos = instance.state.selection.main.head;
          const line = instance.state.doc.lineAt(cursorPos);
          console.log(
            `CM6 Cursor at line: ${line.number}, position: ${cursorPos}`
          );

          window.postMessage(
            {
              type: "CODEMIRROR_CURSOR_UPDATE",
              info: {
                lineNumber: line.number,
                position: cursorPos,
                lineContent: line.text,
              },
            },
            "*"
          );
        } catch (error) {
          console.error("Error in CM6 cursor tracking:", error);
        }
      }, 2000);

      // Proxy CM6 dispatch for change tracking
      try {
        instance.dispatch = new Proxy(instance.dispatch, {
          apply: (target, thisArg, args) => {
            try {
              const result = Reflect.apply(target, thisArg, args);
              const cursorPos = instance.state.selection.main.head;
              const line = instance.state.doc.lineAt(cursorPos);

              window.postMessage(
                {
                  type: "CODEMIRROR_CHANGE",
                  info: {
                    lineNumber: line.number,
                    position: cursorPos,
                    lineContent: line.text,
                  },
                },
                "*"
              );
              return result;
            } catch (error) {
              console.error("Error in dispatch proxy:", error);
              return Reflect.apply(target, thisArg, args);
            }
          },
        });
      } catch (error) {
        console.error("Failed to proxy dispatch method:", error);
      }
    }

    // Notify that we found the instance
    window.postMessage(
      {
        type: "CODEMIRROR_INSTANCE_FOUND",
        info: {
          version: version,
        },
      },
      "*"
    );

    console.log(`CodeMirror ${version} detected and ready to use!`);
  }

  // Try to find CodeMirror immediately
  exposeCodeMirror();

  // Retry detection with delay in case the editor wasn't fully loaded
  let retryCount = 0;
  const maxRetries = 10;

  const retryDetection = () => {
    if (!window._cmView && !window._cmInstance && retryCount < maxRetries) {
      console.log(`Retry attempt ${retryCount + 1} of ${maxRetries}`);
      exposeCodeMirror();
      retryCount++;
      setTimeout(retryDetection, 1000);
    }
  };

  setTimeout(retryDetection, 1000);

  // Also set up a MutationObserver to watch for changes
  const observer = new MutationObserver(() => {
    if (!window._cmView && !window._cmInstance) {
      exposeCodeMirror();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Clean up observer when page unloads
  window.addEventListener("unload", () => {
    observer.disconnect();
  });

  // Let content script know the inject script is fully loaded
  window.postMessage({ type: "INJECT_SCRIPT_LOADED" }, "*");
  console.log("Inject script fully loaded");
})();
