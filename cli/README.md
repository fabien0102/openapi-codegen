# OpenAPI Codegen

## Getting started

1. Add a `openapi-codegen.config.ts` at the root of your project

```ts
// openapi-codegen.config.ts
import { defineConfig } from "@openapi-codegen/cli";
import {
  generateSchemaTypes,
  generateReactQueryComponents,
} from "@openapi-codegen/typescript";

export default defineConfig({
  example: {
    from: {
      source: "github",
      owner: "fabien0102",
      repository: "openapi-codegen",
      ref: "main",
      specPath: "examples/spec.yaml",
    },

    // can be overridden from cli
    outputDir: "src/queries",

    to: async (context) => {
      const filenamePrefix = "example";

      // Generate all the schemas types (components & responses)
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });

      // Generate all react-query components
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
```

2. Expose openapi-codegen in your `package.json`

```diff
--- a/package.json
+++ b/package.json
   "scripts": {
+    "gen": "openapi-codegen",
   }
```

3. Run the generator (`example` is the config key defined in the step 1)

```bash
$ yarn gen example
```

4. Start playing! 🥳
