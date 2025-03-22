import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        "editor-sync-inject": path.resolve(
          __dirname,
          "src/inject/editor-sync-injection.ts"
        ),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
        // No inlineDynamicImports here
      },
    },
  },
});
