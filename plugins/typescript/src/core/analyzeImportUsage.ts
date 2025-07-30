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
  let isUsedAsValue = false;
  let isUsedAsType = false;

  const visitor = (node: ts.Node): void => {
    if (isUsedAsValue && isUsedAsType) {
      return;
    }

    if (ts.isIdentifier(node) && node.text === importName && node.parent) {
      const parent = node.parent;

      if (isValueUsageContext(parent)) {
        isUsedAsValue = true;
      } else if (isTypeUsageContext(parent, node)) {
        isUsedAsType = true;
      }
    }

    if (!(isUsedAsValue && isUsedAsType)) {
      node.forEachChild(visitor);
    }
  };

  for (const node of nodes) {
    visitor(node);
    if (isUsedAsValue && isUsedAsType) {
      break;
    }
  }

  if (!isUsedAsType && !isUsedAsValue) {
    return true;
  }

  return isUsedAsType && !isUsedAsValue;
};
