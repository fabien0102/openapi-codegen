import { defineConfig } from "../src/index";

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
});
