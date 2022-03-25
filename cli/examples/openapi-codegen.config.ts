import { defineConfig } from "../lib/index.js";

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
  withGithub: {
    from: {
      source: "github",
      owner: "fabien0102",
      ref: "main",
      repository: "openapi-codegen",
      specPath: "cli/examples/petstore.json",
    },
    outputDir: "petstore",
    to: async (context) => {
      console.log(context);
    },
  },
});
