// vite.config.popup.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist/popup",
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
