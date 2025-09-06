import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    nodePolyfills({ exclude: ["vm"] }),
    react(),
    nodePolyfills(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  optimizeDeps: {
    include: ["crypto"],
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills({ exclude: ["vm"] })],
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("@zxing")) return "zxing-vendor";
            if (
              id.includes("libsodium") ||
              id.includes("hash-wasm") ||
              id.includes("@noble")
            )
              return "crypto-vendor";
            if (id.includes("workbox")) return "workbox-vendor";
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: { port: 4173 },
});
