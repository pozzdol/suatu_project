import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ["**/*.lottie"],
  server: {
    host: "0.0.0.0",
    port: 3000,
    cors: {
      origin: [
        "http://localhost:11252",
        "http://11.11.17.3:12352",
        "http://puskom.tatametal.app",
        "http://192.168.1.42:11252",
        process.env.VITE_MAIN_APP_URL || "http://localhost:11252",
      ].filter((url): url is string => !!url),
      credentials: true,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@pages", replacement: path.resolve(__dirname, "./src/pages") },
      {
        find: "@components",
        replacement: path.resolve(__dirname, "./src/components"),
      },
    ],
  },
});
