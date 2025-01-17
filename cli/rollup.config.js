import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import shebang from "rollup-plugin-preserve-shebang";
import autoExternal from "rollup-plugin-auto-external";
import internal from "rollup-plugin-internal";
import typescript from "@rollup/plugin-typescript";

const typescriptPlugin = typescript({
  tsconfig: "./tsconfig.package.json",
  compilerOptions: {
    outDir: "lib",
    sourceMap: false,
  },
});

export default [
  {
    input: "src/index.ts",
    output: {
      dir: "lib",
      format: "es",
    },
    cache: false,
    plugins: [typescriptPlugin],
  },
  {
    input: "src/cli.ts",
    output: {
      dir: "lib",
      format: "es",
      banner: "#!/usr/bin/env node",
    },
    cache: false,
    plugins: [
      shebang(),
      resolve(),
      typescriptPlugin,
      commonjs(),
      json(),
      autoExternal(),
      internal(["react", "ink", "@apollo/client"]),
    ],
    external: ["yoga-layout-prebuilt"],
  },
];
