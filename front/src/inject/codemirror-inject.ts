console.log("Codemirror inject script loaded");

declare global {
  interface Window {
    _cmInstance: any;
    _cmView: any;
  }
}

interface EditChange {
  timestamp: number;
  lineNumber: number;
  from: number;
  to: number;
  text: string;
  oldText: string;
}

(function injectCodeMirrorAccess() {
  console.log("Starting CodeMirror detection");
  const recentEdits: EditChange[] = [];
  const MAX_RECENT_EDITS = 20;

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

  // Helper function to log entire document content
  function logEntireDocument(instance: any, version: number) {
    try {
      if (version === 5) {
        const content = instance.getValue();
        console.log("== ENTIRE DOCUMENT CONTENT (CM5) ==");
        console.log(content);
        console.log("== END OF DOCUMENT CONTENT ==");
      } else if (version === 6) {
        const content = instance.state.doc.toString();
        console.log("== ENTIRE DOCUMENT CONTENT (CM6) ==");
        console.log(content);
        console.log("== END OF DOCUMENT CONTENT ==");
      }
    } catch (error) {
      console.error("Error logging entire document:", error);
    }
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

    // Log the entire document content at startup
    logEntireDocument(instance, version);

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

      // Track changes in CM5
      instance.on("changes", (_cm: any, changes: any[]) => {
        changes.forEach((change) => {
          const { from, to, text, removed } = change;
          recentEdits.push({
            timestamp: Date.now(),
            lineNumber: from.line + 1,
            from: from.ch,
            to: to.ch,
            text: text.join("\n"),
            oldText: removed.join("\n"),
          });

          // Keep only the most recent edits
          if (recentEdits.length > MAX_RECENT_EDITS) {
            recentEdits.shift();
          }
        });
      });

      // Log recent edits periodically
      setInterval(() => {
        if (recentEdits.length > 0) {
          console.log("== RECENT EDITS ==");
          recentEdits.forEach((edit, i) => {
            const timeAgo = ((Date.now() - edit.timestamp) / 1000).toFixed(1);
            console.log(
              `[${i + 1}] ${timeAgo}s ago - Line ${edit.lineNumber}: Changed "${
                edit.oldText
              }" to "${edit.text}"`
            );
          });
          console.log("== END OF RECENT EDITS ==");
        }
      }, 5000);
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
              // Get state before change
              const oldState = instance.state;

              // Apply the original method
              const result = Reflect.apply(target, thisArg, args);

              // Check if this is a transaction with changes
              if (args[0] && args[0].changes) {
                // CM6 uses a changeset to represent changes
                const changes = args[0].changes;
                changes.iterChanges(
                  (
                    fromA: number,
                    toA: number,
                    fromB: number,
                    _toB: number,
                    inserted: any
                  ) => {
                    // Get the old text that was replaced
                    const oldText = oldState.doc.sliceString(fromA, toA);
                    const newText = inserted.toString();

                    // Get the line number for this change
                    const lineInfo = instance.state.doc.lineAt(fromB);

                    // Add to recent edits
                    recentEdits.push({
                      timestamp: Date.now(),
                      lineNumber: lineInfo.number,
                      from: fromA,
                      to: toA,
                      text: newText,
                      oldText: oldText,
                    });

                    // Keep only the most recent edits
                    if (recentEdits.length > MAX_RECENT_EDITS) {
                      recentEdits.shift();
                    }
                  }
                );
              }

              // Post just the cursor position on change
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
        console.log("Successfully proxied dispatch method");

        // Log recent edits periodically for CM6
        setInterval(() => {
          if (recentEdits.length > 0) {
            console.log("== RECENT EDITS ==");
            recentEdits.forEach((edit, i) => {
              const timeAgo = ((Date.now() - edit.timestamp) / 1000).toFixed(1);
              console.log(
                `[${i + 1}] ${timeAgo}s ago - Line ${
                  edit.lineNumber
                }: Changed "${edit.oldText}" to "${edit.text}"`
              );
            });
            console.log("== END OF RECENT EDITS ==");
          }
        }, 5000);
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
