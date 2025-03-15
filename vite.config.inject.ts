import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        "codemirror-inject": path.resolve(
          __dirname,
          "src/inject/codemirror-inject.ts"
        ),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
      },
    },
  },
});
