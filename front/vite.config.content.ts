// vite.config.content.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist", // Place the content script in the root of dist
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, "src/shadow_dom/entry.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        inlineDynamicImports: true, // Force everything into a single file
        manualChunks: undefined, // Disable code splitting
      },
    },
    // Make sure to copy the CSS file to the output directory
    assetsInlineLimit: 0,
  },
});
