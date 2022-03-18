import { defineConfig } from "../lib/index.js";
import { generateFetchers } from "@openapi-codegen/typescript";

export default defineConfig({
  withFile: {
    from: {
      source: "file",
      relativePath: "examples/petstore.json",
    },
    outputDir: "petstore",
    to: async (context) => {
      console.log(context);
    },
  },
  withUrl: {
    from: {
      source: "url",
      url: "https://api.apis.guru/v2/specs/github.com/1.1.4/openapi.yaml",
    },
    outputDir: "github",
    to: async (context) => {
      console.log(context);
    },
  },
});
