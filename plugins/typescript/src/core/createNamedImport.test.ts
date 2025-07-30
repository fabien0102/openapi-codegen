import { describe, it, expect } from "vitest";
import { createNamedImport, shouldUseTypeImport } from "./createNamedImport";
import { analyzeImportUsage } from "./analyzeImportUsage";
import { factory as f } from "typescript";
import * as ts from "typescript";

// Helper function to set parent references in AST nodes
const setParentReferences = (node: ts.Node): ts.Node => {
  const setParent = (n: ts.Node, parent: ts.Node) => {
    (n as { parent?: ts.Node }).parent = parent;
    n.forEachChild(child => setParent(child, n));
  };
  
  node.forEachChild(child => setParent(child, node));
  return node;
};

describe("createNamedImport", () => {
  it("should create a regular import when isTypeOnly is false", () => {
    const result = createNamedImport("MyType", "./types", false);
    expect(result.importClause?.isTypeOnly).toBe(false);
  });

  it("should create a type-only import when isTypeOnly is true", () => {
    const result = createNamedImport("MyType", "./types", true);
    expect(result.importClause?.isTypeOnly).toBe(true);
  });

  it("should handle array of imports", () => {
    const result = createNamedImport(["Type1", "Type2"], "./types", true);
    expect(result.importClause?.isTypeOnly).toBe(true);
    expect(result.importClause?.namedBindings).toBeDefined();
  });
});



describe("shouldUseTypeImport", () => {
  it("should return false when useTypeImports is false", () => {
    expect(shouldUseTypeImport("User", false)).toBe(false);
    expect(shouldUseTypeImport("fetchData", false)).toBe(false);
  });

  it("should return false when no AST nodes provided", () => {
    expect(shouldUseTypeImport("User", true)).toBe(false);
    expect(shouldUseTypeImport("fetchData", true)).toBe(false);
  });
});

describe("analyzeImportUsage", () => {
  it("should detect type-only usage", () => {
    const nodes = [
      setParentReferences(f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("MyType"),
        undefined,
        f.createTypeReferenceNode(f.createIdentifier("User"), undefined)
      )),
    ];

    expect(analyzeImportUsage(nodes, "User")).toBe(true);
  });

  it("should detect value usage", () => {
    const nodes = [
      setParentReferences(f.createCallExpression(
        f.createIdentifier("fetchData"),
        undefined,
        []
      )),
    ];

    expect(analyzeImportUsage(nodes, "fetchData")).toBe(false);
  });

  it("should detect mixed usage", () => {
    const nodes = [
      setParentReferences(f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("MyType"),
        undefined,
        f.createTypeReferenceNode(f.createIdentifier("User"), undefined)
      )),
      setParentReferences(f.createCallExpression(
        f.createIdentifier("User"),
        undefined,
        []
      )),
    ];

    expect(analyzeImportUsage(nodes, "User")).toBe(false);
  });

  it("should default to type-only when not used", () => {
    const nodes = [
      setParentReferences(f.createTypeAliasDeclaration(
        undefined,
        f.createIdentifier("MyType"),
        undefined,
        f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      )),
    ];

    expect(analyzeImportUsage(nodes, "UnusedImport")).toBe(true);
  });
}); 