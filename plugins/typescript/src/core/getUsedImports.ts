import { camel } from "case";
import { get } from "lodash";
import ts, { factory as f } from "typescript";

/**
 * Generate the needed imports regarding the generated nodes usage.
 *
 * @param nodes generated nodes
 * @param files files path for dependencies
 */
export const getUsedImports = (
  nodes: ts.Node[],
  files: {
    requestBodies: string;
    schemas: string;
    parameters: string;
    responses: string;
  }
): ts.Node[] => {
  const imports: Record<
    keyof typeof files,
    { used: boolean; namespace: string; from: string }
  > = {
    parameters: {
      used: false,
      namespace: "Parameters",
      from: files.parameters,
    },
    schemas: { used: false, namespace: "Schemas", from: files.schemas },
    requestBodies: {
      used: false,
      namespace: "RequestBodies",
      from: files.requestBodies,
    },
    responses: { used: false, namespace: "Responses", from: files.responses },
  };

  const visitor: ts.Visitor = (node) => {
    if (ts.isQualifiedName(node)) {
      // We can’t use `node.left.getText()` because the node is not compiled (no internal `text` property)
      const text = camel(get(node.left, "escapedText", "") as string);
      if (text in imports) {
        imports[text as keyof typeof imports].used = true;
      }
    }
    return node.forEachChild(visitor);
  };

  ts.visitNodes(f.createNodeArray(nodes), visitor);

  return Object.values(imports)
    .filter((i) => i.used)
    .map((i) => createImportDeclaration(i.namespace, `./${i.from}`));
};

/**
 * Create an `ImportDeclaration` typescript node
 *
 * @param namespace
 * @param from
 * @returns
 */
const createImportDeclaration = (namespace: string, from: string) =>
  f.createImportDeclaration(
    undefined,
    undefined,
    f.createImportClause(
      true,
      undefined,
      f.createNamespaceImport(f.createIdentifier(namespace))
    ),
    f.createStringLiteral(from),
    undefined
  );
