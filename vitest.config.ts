import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^typescript$/,
        replacement: path.resolve(
          __dirname,
          "./plugins/typescript/src/typescript.ts"
        ),
      },
    ],
  },
});
