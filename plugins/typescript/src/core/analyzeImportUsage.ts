import ts from "typescript";

/**
 * Determines if a node represents a value usage context
 */
const isValueUsageContext = (parent: ts.Node): boolean => {
  return (
    ts.isCallExpression(parent) ||
    ts.isObjectBindingPattern(parent) ||
    ts.isPropertyAccessExpression(parent) ||
    ts.isBinaryExpression(parent) ||
    ts.isReturnStatement(parent) ||
    ts.isExportSpecifier(parent) ||
    ts.isImportSpecifier(parent) ||
    ts.isAsExpression(parent) ||
    ts.isNewExpression(parent) ||
    ts.isArrayLiteralExpression(parent) ||
    ts.isObjectLiteralExpression(parent) ||
    ts.isPropertyAssignment(parent) ||
    ts.isVariableDeclaration(parent)
  );
};

/**
 * Determines if a node represents a type usage context
 */
const isTypeUsageContext = (parent: ts.Node, currentNode: ts.Node): boolean => {
  if (
    ts.isTypeReferenceNode(parent) ||
    ts.isTypeAliasDeclaration(parent) ||
    ts.isInterfaceDeclaration(parent)
  ) {
    return true;
  }

  if (ts.isIndexedAccessTypeNode(parent)) {
    return (
      ts.isTypeReferenceNode(parent.objectType) &&
      parent.objectType.typeName === currentNode
    );
  }

  return false;
};

/**
 * Analyzes how an imported symbol is used in the AST.
 *
 * @param nodes the AST nodes to analyze
 * @param importName the name of the imported symbol
 * @returns true if the import is used only as a type
 */
export const analyzeImportUsage = (
  nodes: ts.Node[],
  importName: string
): boolean => {
  const determineUsageType = (): "type-only" | "value" | "mixed" | "unused" => {
    const usages = { type: false, value: false };

    const checkNode = (node: ts.Node): boolean => {
      // returns: should continue
      if (ts.isIdentifier(node) && node.text === importName && node.parent) {
        const parent = node.parent;

        if (isValueUsageContext(parent)) usages.value = true;
        if (isTypeUsageContext(parent, node)) usages.type = true;

        return !(usages.type && usages.value);
      }

      return !node.forEachChild((child) => !checkNode(child));
    };

    nodes.every(checkNode);

    if (!usages.type && !usages.value) return "unused";
    if (usages.type && usages.value) return "mixed";
    return usages.type ? "type-only" : "value";
  };

  const usage = determineUsageType();
  return usage === "type-only" || usage === "unused";
};
