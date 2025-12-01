import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    define: {
      // exposes GEMINI_API_KEY as import.meta.env.VITE_GEMINI_API_KEY
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      outDir: "dist",
    },
  };
});
