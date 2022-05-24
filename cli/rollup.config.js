import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import shebang from "rollup-plugin-preserve-shebang";
import autoExternal from "rollup-plugin-auto-external";
import internal from "rollup-plugin-internal";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/cli.ts",
  output: {
    file: "lib/cli.js",
    format: "es",
    banner: "#!/usr/bin/env node",
  },
  cache: false,
  plugins: [
    shebang(),
    resolve(),
    typescript({
      tsconfig: "./tsconfig.package.json",
      compilerOptions: {
        outDir: ".",
        sourceMap: false,
      },
    }),
    commonjs(),
    json(),
    autoExternal(),
    internal(["react", "ink", "@apollo/client"]),
  ],
  external: ["yoga-layout-prebuilt"],
};
