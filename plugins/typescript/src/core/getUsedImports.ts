import { camel } from "case";
import { get } from "lodash";
import ts, { factory as f } from "typescript";
import { createNamedImport } from "./createNamedImport";
import { createNamespaceImport } from "./createNamespaceImport";
import { clientErrorStatus, serverErrorStatus } from "./getErrorResponseType";

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
    utils: string;
  }
): { keys: string[]; nodes: ts.Node[] } => {
  const imports: Record<
    keyof typeof files,
    | { type: "namespace"; used: boolean; namespace: string; from: string }
    | { type: "named"; used: boolean; imports: Set<string>; from: string }
  > = {
    parameters: {
      type: "namespace",
      used: false,
      namespace: "Parameters",
      from: files.parameters,
    },
    schemas: {
      type: "namespace",
      used: false,
      namespace: "Schemas",
      from: files.schemas,
    },
    requestBodies: {
      type: "namespace",
      used: false,
      namespace: "RequestBodies",
      from: files.requestBodies,
    },
    responses: {
      type: "namespace",
      used: false,
      namespace: "Responses",
      from: files.responses,
    },
    utils: {
      type: "named",
      used: false,
      from: files.utils,
      imports: new Set(),
    },
  };

  const visitor: ts.Visitor = (node) => {
    if (ts.isQualifiedName(node)) {
      // We can’t use `node.left.getText()` because the node is not compiled (no internal `text` property)
      const text = camel(get(node.left, "escapedText", "") as string);
      if (text in imports) {
        imports[text as keyof typeof imports].used = true;
      }
    }
    if (imports.utils.type === "named" && ts.isTypeReferenceNode(node)) {
      if (get(node.typeName, "escapedText", "") === clientErrorStatus) {
        imports.utils.used = true;
        imports.utils.imports.add(clientErrorStatus);
      }
      if (get(node.typeName, "escapedText", "") === serverErrorStatus) {
        imports.utils.used = true;
        imports.utils.imports.add(serverErrorStatus);
      }
    }
    return node.forEachChild(visitor);
  };

  ts.visitNodes(f.createNodeArray(nodes), visitor);

  const usedImports = Object.entries(imports).filter(([_key, i]) => i.used);

  return {
    keys: usedImports.map(([key]) => key),
    nodes: usedImports.map(([_key, i]) => {
      if (i.type === "namespace") {
        return createNamespaceImport(i.namespace, `./${i.from}`);
      } else {
        return createNamedImport(Array.from(i.imports.values()), `./${i.from}`, true);
      }
    }),
  };
};
