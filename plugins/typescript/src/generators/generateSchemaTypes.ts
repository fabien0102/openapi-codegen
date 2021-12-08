import {
  isReferenceObject,
  MediaTypeObject,
  OpenAPIObject,
  RequestBodyObject,
  ResponseObject,
} from "openapi3-ts";
import * as c from "case";
import { schemaToTypeAliasDeclaration } from "../core/schemaToTypeAliasDeclaration";
import ts, { factory as f } from "typescript";
import { get } from "lodash";

export type Context = {
  openAPIDocument: OpenAPIObject;
  writeFile: (file: string, data: string) => Promise<void>;
};

type Config = {
  /**
   * @default openapi.info.title
   */
  filenamePrefix?: string;
  /**
   * Case convention for filenames.
   *
   * @default camel
   */
  filenameCase?: keyof Pick<typeof c, "snake" | "camel" | "kebab" | "pascal">;
};

/**
 * Generate schemas types (components & responses)
 * @param context CLI Context
 * @param config Configuration
 */
export const generateSchemaTypes = async (
  context: Context,
  config: Config = {}
) => {
  const { components } = context.openAPIDocument;
  if (!components) return;

  const sourceFile = ts.createSourceFile(
    "index.ts",
    "",
    ts.ScriptTarget.Latest
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  const printNodes = (nodes: ts.Node[]) =>
    nodes
      .map((node: ts.Node) => {
        return (
          printer.printNode(ts.EmitHint.Unspecified, node, sourceFile) +
          (ts.isJSDoc(node) ? "" : "\n")
        );
      })
      .join("\n");

  const filenamePrefix =
    c.snake(config.filenamePrefix || context.openAPIDocument.info.title) + "-";
  const formatFilename = config.filenameCase ? c[config.filenameCase] : c.camel;
  const files = {
    requestBodies: formatFilename(filenamePrefix + "-request-bodies"),
    schemas: formatFilename(filenamePrefix + "-schemas"),
    parameters: formatFilename(filenamePrefix + "-parameters"),
    responses: formatFilename(filenamePrefix + "-responses"),
  };

  // Generate `components/schemas` types
  if (components.schemas) {
    const componentsSchemas = Object.entries(components.schemas).reduce<
      ts.Node[]
    >(
      (mem, [name, schema]) => [
        ...mem,
        ...schemaToTypeAliasDeclaration(name, schema, {
          openAPIDocument: context.openAPIDocument,
          currentComponent: "schemas",
        }),
      ],
      []
    );

    await context.writeFile(
      files.schemas + ".ts",
      printNodes([
        ...getUsedImports(componentsSchemas, files),
        ...componentsSchemas,
      ])
    );
  }

  // Generate `components/responses` types
  if (components.responses) {
    const componentsResponses = Object.entries(components.responses).reduce<
      ts.Node[]
    >((mem, [name, responseObject]) => {
      if (isReferenceObject(responseObject)) return mem;
      const mediaType = findCompatibleMediaType(responseObject);
      if (!mediaType || !mediaType.schema) return mem;

      return [
        ...mem,
        ...schemaToTypeAliasDeclaration(name, mediaType.schema, {
          openAPIDocument: context.openAPIDocument,
          currentComponent: "responses",
        }),
      ];
    }, []);

    if (componentsResponses.length) {
      await context.writeFile(
        files.responses + ".ts",
        printNodes([
          ...getUsedImports(componentsResponses, files),
          ...componentsResponses,
        ])
      );
    }
  }

  // Generate `components/requestBodies` types
  if (components.requestBodies) {
    const componentsRequestBodies = Object.entries(
      components.requestBodies
    ).reduce<ts.Node[]>((mem, [name, requestBodyObject]) => {
      if (isReferenceObject(requestBodyObject)) return mem;
      const mediaType = findCompatibleMediaType(requestBodyObject);
      if (!mediaType || !mediaType.schema) return mem;

      return [
        ...mem,
        ...schemaToTypeAliasDeclaration(name, mediaType.schema, {
          openAPIDocument: context.openAPIDocument,
          currentComponent: "requestBodies",
        }),
      ];
    }, []);

    if (componentsRequestBodies.length) {
      await context.writeFile(
        files.requestBodies + ".ts",
        printNodes([
          ...getUsedImports(componentsRequestBodies, files),
          ...componentsRequestBodies,
        ])
      );
    }
  }

  // Generate `components/parameters` types
  if (components.parameters) {
    const componentsParameters = Object.entries(components.parameters).reduce<
      ts.Node[]
    >((mem, [name, parameterObject]) => {
      if (isReferenceObject(parameterObject) || !parameterObject.schema) {
        return mem;
      }
      return [
        ...mem,
        ...schemaToTypeAliasDeclaration(name, parameterObject.schema, {
          openAPIDocument: context.openAPIDocument,
          currentComponent: "parameters",
        }),
      ];
    }, []);

    await context.writeFile(
      files.parameters + ".ts",
      printNodes([
        ...getUsedImports(componentsParameters, files),
        ...componentsParameters,
      ])
    );
  }
};

/**
 * Returns the first compatible media type.
 *
 * @param requestBodyOrResponseObject
 * @returns
 */
const findCompatibleMediaType = (
  requestBodyOrResponseObject: RequestBodyObject | ResponseObject
): MediaTypeObject | undefined => {
  if (!requestBodyOrResponseObject.content) return;
  for (let contentType of Object.keys(requestBodyOrResponseObject.content)) {
    if (
      contentType.startsWith("*/*") ||
      contentType.startsWith("application/json") ||
      contentType.startsWith("application/octet-stream")
    ) {
      return requestBodyOrResponseObject.content[contentType];
    }
  }
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

/**
 * Generate the needed imports regarding the generated nodes usage.
 *
 * @param nodes generated nodes
 * @param files files path for dependencies
 */
const getUsedImports = (
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
      const text = (get(node.left, "escapedText", "") as string).toLowerCase();
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
