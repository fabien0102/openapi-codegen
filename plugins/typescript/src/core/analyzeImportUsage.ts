import ts from "typescript";

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
    if (ts.isIdentifier(node) && node.text === importName) {
      const parent = node.parent;
      
      if (parent) {
        if (
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
          ts.isObjectLiteralExpression(parent)
        ) {
          isUsedAsValue = true;
        }
        else if (
          ts.isTypeReferenceNode(parent) ||
          ts.isTypeAliasDeclaration(parent) ||
          ts.isInterfaceDeclaration(parent)
        ) {
          isUsedAsType = true;
        }
        else if (ts.isIndexedAccessTypeNode(parent)) {
          if (ts.isTypeReferenceNode(parent.objectType) && parent.objectType.typeName === node) {
            isUsedAsType = true;
          }
        }
      }
    }

    node.forEachChild(visitor);
  };

  nodes.forEach(visitor);

  if (!isUsedAsType && !isUsedAsValue) {
    return true;
  }
  return isUsedAsType && !isUsedAsValue;
}; 