import { describe, expect, it } from "vitest";
import { OpenAPIObject, SchemaObject } from "openapi3-ts";
import ts from "typescript";
import { schemaToEnumDeclaration } from "./schemaToEnumDeclaration";
import { OpenAPIComponentType } from "./schemaToTypeAliasDeclaration";

describe("schemaToTypeAliasDeclaration", () => {
  it("should generate a string enums", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: ["AVAILABLE", "PENDING", "SOLD"],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export enum Test {
          Available = "AVAILABLE",
          Pending = "PENDING",
          Sold = "SOLD"
      }"
    `);
  });

  it("should generate a int enum", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: [1, 2, 3],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export enum Test {
          One = 1,
          Two = 2,
          Three = 3
      }"
    `);
  });

  it("should generate a int enum (using big numbers)", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: [0, 7, 15, 100, 1000, 1456, 3217],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export enum Test {
          Zero = 0,
          Seven = 7,
          Fifteen = 15,
          OneHundred = 100,
          OneThousand = 1000,
          OneThousandFourHundredFiftySix = 1456,
          ThreeThousandTwoHundredSeventeen = 3217
      }"
    `);
  });

  it("should generate a boolean enum", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: [true, false],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export enum Test {
          True,
          False
      }"
    `);
  });

  it("should generate valid enum with values that contains spaces", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: ["saimois", "bengal", "british shorthair"],
    };

    expect(printSchema(schema, "test")).toMatchInlineSnapshot(`
      "export enum Test {
          Saimois = "saimois",
          Bengal = "bengal",
          BritishShorthair = "british shorthair"
      }"
    `);
  });
});

const printSchema = (
  schema: SchemaObject,
  schemaName: string = "Test",
  currentComponent: OpenAPIComponentType = "schemas",
  components?: OpenAPIObject["components"]
) => {
  const nodes = schemaToEnumDeclaration(schemaName, schema, {
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
