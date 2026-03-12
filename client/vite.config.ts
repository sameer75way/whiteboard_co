import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@theme": path.resolve(__dirname, "./src/theme")
    }
  },
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('konva')) return 'konva';
            if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
            if (id.includes('dexie') || id.includes('idb')) return 'db';
            if (id.match(/node_modules\/(react|react-dom|scheduler)\//)) return 'core';
          }
        }
      }
    }
  }
});