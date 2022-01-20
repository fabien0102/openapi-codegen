import { omit } from "lodash";
import ts, { factory } from "typescript";
import { OperationObject } from "openapi3-ts";

import { petstore } from "../fixtures/petstore";
import { getOperationTypes } from "./getOperationTypes";

describe("getOperationTypes", () => {
  it("should generate a variable type (with extra props)", () => {
    const output = getOperationTypes({
      operationId: "listPet",
      operation: petstore.paths["/pets"].get as OperationObject,
      openAPIDocument: petstore,
      printNodes: () => "",
      variablesExtraPropsType: factory.createTypeReferenceNode("ExtraProps"),
    });

    expect(print(output.declarationNodes[2])).toMatchInlineSnapshot(`
      "export type ListPetVariables = {
          queryParams?: ListPetQueryParams;
      } & ExtraProps;"
    `);
  });

  it("should generate a variable type (without extra props)", () => {
    const output = getOperationTypes({
      operationId: "listPet",
      operation: petstore.paths["/pets"].get as OperationObject,
      openAPIDocument: petstore,
      printNodes: () => "",
      variablesExtraPropsType: factory.createKeywordTypeNode(
        ts.SyntaxKind.VoidKeyword
      ),
    });

    expect(print(output.declarationNodes[2])).toMatchInlineSnapshot(`
      "export type ListPetVariables = {
          queryParams?: ListPetQueryParams;
      };"
    `);
  });

  it("should generate a variable type (with extra props only)", () => {
    const output = getOperationTypes({
      operationId: "listPet",
      operation: omit(
        petstore.paths["/pets"].get,
        "parameters"
      ) as OperationObject,
      openAPIDocument: petstore,
      printNodes: () => "",
      variablesExtraPropsType: factory.createTypeReferenceNode("ExtraProps"),
    });

    expect(print(output.declarationNodes[1])).toMatchInlineSnapshot(
      `"export type ListPetVariables = ExtraProps;"`
    );
  });

  it("should generate a variable type (void)", () => {
    const output = getOperationTypes({
      operationId: "listPet",
      operation: omit(
        petstore.paths["/pets"].get,
        "parameters"
      ) as OperationObject,
      openAPIDocument: petstore,
      printNodes: () => "",
      variablesExtraPropsType: factory.createKeywordTypeNode(
        ts.SyntaxKind.VoidKeyword
      ),
    });

    expect(output.declarationNodes.length).toBe(1);
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
