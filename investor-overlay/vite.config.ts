import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  // Relative asset paths so popup/options load in Edge/Chrome unpacked extensions.
  base: "./",
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "src/popup/index.html",
        options: "src/options/index.html",
        "sidebar-panel": "src/sidebar-panel/index.html",
      },
    },
  },
});
