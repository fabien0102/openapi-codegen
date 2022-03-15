import ts from "typescript";
import { addImports } from "./addImports";

describe("addImports", () => {
  it("should add import statement if not already existing", () => {
    const sourceText = `import { defineConfig } from "@openapi-codegen/cli";
    
    // This comment should stay
    export default defineConfig({})`;
    const sourceFile = ts.createSourceFile(
      "openapi-codegen.config.ts",
      sourceText,
      ts.ScriptTarget.Latest
    );

    const transformedSourceFile = addImports({
      sourceFile,
      existingImports: ["@openapi-codegen/cli"],
      importsToInsert: [
        {
          namedImports: ["generateReactQueryComponents", "generateSchemaTypes"],
          module: "@openapi-codegen/typescript",
        },
      ],
    });

    expect(printer.printFile(transformedSourceFile)).toMatchInlineSnapshot(`
      "import { generateReactQueryComponents, generateSchemaTypes } from \\"@openapi-codegen/typescript\\";
      import { defineConfig } from \\"@openapi-codegen/cli\\";
      // This comment should stay
      export default defineConfig({});
      "
    `);
  });

  it("should update import statement if already existing", () => {
    const sourceText = `import { defineConfig } from "@openapi-codegen/cli";
    import { renameComponent } from "@openapi-codegen/typescript";

    export default defineConfig({})`;
    const sourceFile = ts.createSourceFile(
      "openapi-codegen.config.ts",
      sourceText,
      ts.ScriptTarget.Latest
    );

    const transformedSourceFile = addImports({
      sourceFile,
      existingImports: ["@openapi-codegen/cli", "@openapi-codegen/typescript"],
      importsToInsert: [
        {
          namedImports: ["generateReactQueryComponents", "generateSchemaTypes"],
          module: "@openapi-codegen/typescript",
        },
      ],
    });

    expect(printer.printFile(transformedSourceFile)).toMatchInlineSnapshot(`
      "import { defineConfig } from \\"@openapi-codegen/cli\\";
      import { renameComponent, generateReactQueryComponents, generateSchemaTypes } from \\"@openapi-codegen/typescript\\";
      export default defineConfig({});
      "
    `);
  });

  it("should not create duplicates", () => {
    const sourceText = `import { defineConfig } from "@openapi-codegen/cli";
    import { renameComponent, generateReactQueryComponents } from "@openapi-codegen/typescript";

    export default defineConfig({})`;
    const sourceFile = ts.createSourceFile(
      "openapi-codegen.config.ts",
      sourceText,
      ts.ScriptTarget.Latest
    );

    const transformedSourceFile = addImports({
      sourceFile,
      existingImports: ["@openapi-codegen/cli", "@openapi-codegen/typescript"],
      importsToInsert: [
        {
          namedImports: ["generateReactQueryComponents", "generateSchemaTypes"],
          module: "@openapi-codegen/typescript",
        },
      ],
    });

    expect(printer.printFile(transformedSourceFile)).toMatchInlineSnapshot(`
      "import { defineConfig } from \\"@openapi-codegen/cli\\";
      import { renameComponent, generateReactQueryComponents, generateSchemaTypes } from \\"@openapi-codegen/typescript\\";
      export default defineConfig({});
      "
    `);
  });
});

// Helpers
const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
});
