(function () {
  // Wait for the CodeMirror instance to be available
  function waitForCodeMirror() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const codeMirrorInstance = document.querySelector(".CodeMirror");
        if (codeMirrorInstance) {
          clearInterval(interval);
          resolve(codeMirrorInstance);
        }
      }, 100);
    });
  }

  // Access the CodeMirror instance and use its API
  waitForCodeMirror().then((codeMirrorInstance) => {
    const cm = codeMirrorInstance.CodeMirror;
    if (cm) {
      // Example: Get the content of the CodeMirror editor
      const content = cm.getValue();
      console.log("CodeMirror content:", content);

      // You can now use other CodeMirror API methods as needed
    }
  });
})();
