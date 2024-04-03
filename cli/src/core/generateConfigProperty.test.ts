import ts from "typescript";
import { generateConfigProperty } from "./generateConfigProperty";

describe("generateConfigProperty", () => {
  it("should generate a type only configuration node", () => {
    const config = generateConfigProperty({
      namespace: "foo",
      options: {
        from: {
          source: "file",
          relativePath: "specs.yaml",
        },
        outputDir: "specs",
        plugin: "typescript/types-only",
      },
    });

    expect(print(config)).toMatchInlineSnapshot(`
     "foo: {
         from: {
             source: "file",
             relativePath: "specs.yaml"
         },
         outputDir: "specs",
         to: async (context) => {
             await generateSchemaTypes(context, {
                 filenamePrefix: "foo"
             });
         }
     }"
    `);
  });

  it("should generate a react-query configuration node", () => {
    const config = generateConfigProperty({
      namespace: "foo",
      options: {
        from: {
          source: "file",
          relativePath: "specs.yaml",
        },
        outputDir: "specs",
        plugin: "typescript/react-query",
      },
    });

    expect(print(config)).toMatchInlineSnapshot(`
     "foo: {
         from: {
             source: "file",
             relativePath: "specs.yaml"
         },
         outputDir: "specs",
         to: async (context) => {
             const filenamePrefix = "foo";
             const { schemasFiles } = await generateSchemaTypes(context, {
                 filenamePrefix
             });
             await generateReactQueryComponents(context, {
                 filenamePrefix,
                 schemasFiles
             });
         }
     }"
    `);
  });

  it("should generate a react-query configuration node", () => {
    const config = generateConfigProperty({
      namespace: "foo",
      options: {
        from: {
          source: "github",
          ref: "main",
          owner: "fabien0102",
          repository: "openapi-codegen",
          specPath: "examples/petstore.json",
        },
        outputDir: "specs",
        plugin: "typescript/fetch",
      },
    });

    expect(print(config)).toMatchInlineSnapshot(`
     "foo: {
         from: {
             source: "github",
             ref: "main",
             owner: "fabien0102",
             repository: "openapi-codegen",
             specPath: "examples/petstore.json"
         },
         outputDir: "specs",
         to: async (context) => {
             const filenamePrefix = "foo";
             const { schemasFiles } = await generateSchemaTypes(context, {
                 filenamePrefix
             });
             await generateFetchers(context, {
                 filenamePrefix,
                 schemasFiles
             });
         }
     }"
    `);
  });
});

// Helpers
const sourceFile = ts.createSourceFile("index.ts", "", ts.ScriptTarget.Latest);

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
});

const print = (node: ts.Node) =>
  printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
