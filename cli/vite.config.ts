import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: [
    {
      entry: ["src/index.ts"],
      dts: true,
      format: ["esm", "cjs"],
      sourcemap: true,
    },
    {
      entry: ["src/cli.ts"],
    },
  ],
});
