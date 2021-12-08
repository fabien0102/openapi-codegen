import { OpenAPIObject } from "openapi3-ts";
import * as c from "case";
import { schemaToTypeAliasDeclaration } from "../core/schemaToTypeAliasDeclaration";
import ts from "typescript";

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

  // Generate `components/schemas` types
  const componentsSchemas: ts.Node[] = [];
  if (context.openAPIDocument.components?.schemas) {
    Object.entries(context.openAPIDocument.components?.schemas).forEach(
      ([name, schema]) => {
        componentsSchemas.push(
          ...schemaToTypeAliasDeclaration(name, schema, {
            openAPIDocument: context.openAPIDocument,
            refPrefixes: {
              parameters: "Parameters.",
              requestBodies: "RequestBodies.",
              responses: "Responses.",
              schemas: "",
            },
          })
        );
      }
    );

    // TODO deal with imports
    await context.writeFile(
      formatFilename(filenamePrefix + "-schemas") + ".ts",
      printNodes(componentsSchemas)
    );
  }
};
