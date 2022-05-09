import ts from "typescript";

/**
 * Collect errors in `allErrors` map.
 */
export const collectErrors = ({
  errorType,
  printNodes,
  allErrors,
}: {
  // Nodes from `getErrorResponseType`
  errorType: ts.TypeReferenceNode;
  // Printer
  printNodes: (nodes: ts.Node[]) => string;
  // Persistent Map to collect errors
  allErrors: Map<string, ts.Node>;
}) => {
  const visit = (node: ts.Node) => {
    // @ts-expect-error
    if (ts.isPropertySignature(node) && node.name.escapedText === "payload") {
      const { type } = node;
      if (!type) return;
      if (ts.isUnionTypeNode(type)) {
        type.types.forEach((i) => allErrors.set(printNodes([i]), i));
        return;
      }
      allErrors.set(printNodes([type]), type);
    }
    node.forEachChild(visit);
  };

  visit(errorType);
};
