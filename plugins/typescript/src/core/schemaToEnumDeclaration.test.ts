import { OpenAPIObject, SchemaObject } from "openapi3-ts";
import ts from "typescript";
import { schemaToEnumDeclaration } from "./schemaToEnumDeclaration";
import { OpenAPIComponentType } from "./schemaToTypeAliasDeclaration";

describe("schemaToTypeAliasDeclaration", () => {
  it("should generate enums", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: ["AVAILABLE", "PENDING", "SOLD"],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export enum Test {
          AVAILABLE = \\"AVAILABLE\\",
          PENDING = \\"PENDING\\",
          SOLD = \\"SOLD\\"
      }"
    `);
  });
});

const printSchema = (
  schema: SchemaObject,
  currentComponent: OpenAPIComponentType = "schemas",
  components?: OpenAPIObject["components"]
) => {
  const nodes = schemaToEnumDeclaration("Test", schema, {
    currentComponent,
    openAPIDocument: { components },
  });

  const sourceFile = ts.createSourceFile(
    "index.ts",
    "",
    ts.ScriptTarget.Latest
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  return nodes
    .map((node: ts.Node) =>
      printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
    )
    .join("\n");
};
