import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "LivechatOSSWidget",
      fileName: (format) => `livechat-oss-widget.${format}.js`,
      formats: ["umd"],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        // Ensure the UMD build exposes the correct global
        name: "LivechatOSSWidget",
      },
    },
    cssCodeSplit: false,
    minify: "terser",
    // Inline CSS into JS to make it a single file
    assetsInlineLimit: 100000000,
  },
});
