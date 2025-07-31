import { describe, it, expect } from "vitest";
import ts, { factory as f } from "typescript";
import { analyzeImportUsage } from "./analyzeImportUsage";

// Helper to set parent references for TypeScript AST nodes
const setParentReferences = <T extends ts.Node>(node: T): T => {
  function setParent(child: ts.Node, parent: ts.Node) {
    Object.defineProperty(child, "parent", {
      value: parent,
      writable: true,
      configurable: true,
    });
    child.forEachChild((grandChild) => setParent(grandChild, child));
  }
  node.forEachChild((child) => setParent(child, node));
  return node;
};

describe("analyzeImportUsage", () => {
  describe("type-only usage", () => {
    it("should detect type reference usage", () => {
      const nodes = [
        setParentReferences(
          f.createTypeAliasDeclaration(
            undefined,
            f.createIdentifier("MyAlias"),
            undefined,
            f.createTypeReferenceNode(
              f.createIdentifier("TestImport"),
              undefined
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(true);
    });

    it("should detect usage in type alias declaration", () => {
      const nodes = [
        setParentReferences(
          f.createTypeAliasDeclaration(
            undefined,
            f.createIdentifier("TestImport"),
            undefined,
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(true);
    });

    it("should detect usage in interface declaration", () => {
      const nodes = [
        setParentReferences(
          f.createInterfaceDeclaration(
            undefined,
            f.createIdentifier("TestImport"),
            undefined,
            undefined,
            []
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(true);
    });

    it("should detect indexed access type usage", () => {
      const typeRef = f.createTypeReferenceNode(
        f.createIdentifier("TestImport"),
        undefined
      );
      const nodes = [
        setParentReferences(
          f.createTypeAliasDeclaration(
            undefined,
            f.createIdentifier("MyType"),
            undefined,
            f.createIndexedAccessTypeNode(
              typeRef,
              f.createLiteralTypeNode(f.createStringLiteral("prop"))
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(true);
    });
  });

  describe("value usage", () => {
    it("should detect call expression usage", () => {
      const nodes = [
        setParentReferences(
          f.createExpressionStatement(
            f.createCallExpression(
              f.createIdentifier("TestImport"),
              undefined,
              []
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });

    it("should detect property access usage", () => {
      const nodes = [
        setParentReferences(
          f.createExpressionStatement(
            f.createPropertyAccessExpression(
              f.createIdentifier("TestImport"),
              f.createIdentifier("prop")
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });

    it("should detect binary expression usage", () => {
      const nodes = [
        setParentReferences(
          f.createExpressionStatement(
            f.createBinaryExpression(
              f.createIdentifier("TestImport"),
              ts.SyntaxKind.EqualsEqualsToken,
              f.createStringLiteral("test")
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });

    it("should detect new expression usage", () => {
      const nodes = [
        setParentReferences(
          f.createExpressionStatement(
            f.createNewExpression(
              f.createIdentifier("TestImport"),
              undefined,
              []
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });

    it("should detect array literal usage", () => {
      const nodes = [
        setParentReferences(
          f.createVariableStatement(
            undefined,
            f.createVariableDeclarationList([
              f.createVariableDeclaration(
                f.createIdentifier("arr"),
                undefined,
                undefined,
                f.createArrayLiteralExpression([
                  f.createIdentifier("TestImport"),
                ])
              ),
            ])
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });

    it("should detect object literal usage", () => {
      const objectLiteral = f.createObjectLiteralExpression([
        f.createPropertyAssignment("key", f.createIdentifier("TestImport")),
      ]);
      const nodes = [
        setParentReferences(
          f.createVariableStatement(
            undefined,
            f.createVariableDeclarationList([
              f.createVariableDeclaration(
                f.createIdentifier("obj"),
                undefined,
                undefined,
                objectLiteral
              ),
            ])
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });
  });

  describe("mixed usage", () => {
    it("should detect mixed type and value usage", () => {
      const nodes = [
        // Type usage
        setParentReferences(
          f.createTypeAliasDeclaration(
            undefined,
            f.createIdentifier("MyType"),
            undefined,
            f.createTypeReferenceNode(
              f.createIdentifier("TestImport"),
              undefined
            )
          )
        ),
        // Value usage
        setParentReferences(
          f.createExpressionStatement(
            f.createCallExpression(
              f.createIdentifier("TestImport"),
              undefined,
              []
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });
  });

  describe("unused imports", () => {
    it("should default to type-only for unused imports", () => {
      const nodes = [
        setParentReferences(
          f.createTypeAliasDeclaration(
            undefined,
            f.createIdentifier("MyType"),
            undefined,
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "UnusedImport")).toBe(true);
    });

    it("should handle empty node array", () => {
      expect(analyzeImportUsage([], "TestImport")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle nodes without parents", () => {
      const identifier = f.createIdentifier("TestImport");
      // Explicitly don't set parent references
      expect(analyzeImportUsage([identifier], "TestImport")).toBe(true);
    });

    it("should be case sensitive", () => {
      const nodes = [
        setParentReferences(
          f.createExpressionStatement(
            f.createCallExpression(
              f.createIdentifier("testImport"), // lowercase
              undefined,
              []
            )
          )
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(true); // Should default to type-only
    });

    it("should handle deeply nested usage", () => {
      const nodes = [
        setParentReferences(
          f.createBlock([
            f.createIfStatement(
              f.createBinaryExpression(
                f.createTrue(),
                ts.SyntaxKind.EqualsEqualsToken,
                f.createTrue()
              ),
              f.createBlock([
                f.createExpressionStatement(
                  f.createCallExpression(
                    f.createIdentifier("TestImport"),
                    undefined,
                    []
                  )
                ),
              ])
            ),
          ])
        ),
      ];

      expect(analyzeImportUsage(nodes, "TestImport")).toBe(false);
    });
  });

  describe("performance optimization", () => {
    it("should return false for mixed usage", () => {
      const nodes = [
        // Type usage
        setParentReferences(
          f.createTypeAliasDeclaration(
            undefined,
            f.createIdentifier("MyType"),
            undefined,
            f.createTypeReferenceNode(
              f.createIdentifier("TestImport"),
              undefined
            )
          )
        ),
        // Value usage
        setParentReferences(
          f.createExpressionStatement(
            f.createCallExpression(
              f.createIdentifier("TestImport"),
              undefined,
              []
            )
          )
        ),
        // Additional nodes - should stop before processing these
        setParentReferences(
          f.createTypeAliasDeclaration(
            undefined,
            f.createIdentifier("AnotherType"),
            undefined,
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
          )
        ),
      ];

      const result = analyzeImportUsage(nodes, "TestImport");
      expect(result).toBe(false);
    });
  });
});
