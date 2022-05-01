import {
  generateSchemaTypes,
  generateReactQueryComponents,
} from "@openapi-codegen/typescript";
import { defineConfig } from "@openapi-codegen/cli";
export default defineConfig({
  github: {
    from: {
      source: "url",
      url: "https://api.apis.guru/v2/specs/github.com/1.1.4/openapi.yaml",
    },
    outputDir: "src/github",
    to: async (context) => {
      const filenamePrefix = "github";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
