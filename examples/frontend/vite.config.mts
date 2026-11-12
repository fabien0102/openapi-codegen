import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [react()]),
});
