import ts, { factory as f } from "typescript";
import * as c from "case";

import { ConfigBase, Context } from "./types";
import { PathItemObject } from "openapi3-ts";

import { getUsedImports } from "../core/getUsedImports";
import { createWatermark } from "../core/createWatermark";
import { createOperationFetcherFnNodes } from "../core/createOperationFetcherFnNodes";
import { isVerb } from "../core/isVerb";
import { isOperationObject } from "../core/isOperationObject";
import { getOperationTypes } from "../core/getOperationTypes";
import { createNamedImport } from "../core/createNamedImport";

import { getFetcher } from "../templates/fetcher";

export type Config = ConfigBase & {
  /**
   * Generated files paths from `generateSchemaTypes`
   */
  schemasFiles: {
    requestBodies: string;
    schemas: string;
    parameters: string;
    responses: string;
  };
  /**
   * List of headers injected in the custom fetcher
   *
   * This will mark the header as optional in the component API
   */
  injectedHeaders?: string[];
};

export const generateFetchers = async (context: Context, config: Config) => {
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
      .map((node: ts.Node, i, nodes) => {
        return (
          printer.printNode(ts.EmitHint.Unspecified, node, sourceFile) +
          (ts.isJSDoc(node) ||
          (ts.isImportDeclaration(node) &&
            nodes[i + 1] &&
            ts.isImportDeclaration(nodes[i + 1]))
            ? ""
            : "\n")
        );
      })
      .join("\n");

  const filenamePrefix =
    c.snake(config.filenamePrefix || context.openAPIDocument.info.title) + "-";
  const formatFilename = config.filenameCase ? c[config.filenameCase] : c.camel;

  const filename = formatFilename(filenamePrefix + "-components");

  const fetcherFn = c.camel(`${filenamePrefix}-fetch`);
  const nodes: ts.Node[] = [];
  const fetcherImports = [fetcherFn];

  const fetcherFilename = formatFilename(filenamePrefix + "-fetcher");

  const fetcherExtraPropsTypeName = `${c.pascal(
    filenamePrefix
  )}FetcherExtraProps`;

  let variablesExtraPropsType: ts.TypeNode = f.createKeywordTypeNode(
    ts.SyntaxKind.VoidKeyword
  );

  if (!context.existsFile(`${fetcherFilename}.ts`)) {
    context.writeFile(`${fetcherFilename}.ts`, getFetcher(filenamePrefix));
  } else {
    const fetcherSourceText = await context.readFile(`${fetcherFilename}.ts`);

    const fetcherSourceFile = ts.createSourceFile(
      `${fetcherFilename}.ts`,
      fetcherSourceText,
      ts.ScriptTarget.Latest
    );

    // Lookup for {prefix}FetcherExtraProps declaration
    ts.forEachChild(fetcherSourceFile, (node) => {
      if (
        ts.isTypeAliasDeclaration(node) &&
        node.name.escapedText === fetcherExtraPropsTypeName &&
        ts.isTypeLiteralNode(node.type) &&
        node.type.members.length > 0
      ) {
        // Use the type of defined
        variablesExtraPropsType = f.createTypeReferenceNode(
          fetcherExtraPropsTypeName
        );
        fetcherImports.push(fetcherExtraPropsTypeName);
      }
    });
  }

  const operationIds: string[] = [];
  const operationByTags: Record<string, string[]> = {};

  Object.entries(context.openAPIDocument.paths).forEach(
    ([route, verbs]: [string, PathItemObject]) => {
      Object.entries(verbs).forEach(([verb, operation]) => {
        if (!isVerb(verb) || !isOperationObject(operation)) return;
        const operationId = c.camel(operation.operationId);
        if (operationIds.includes(operationId)) {
          throw new Error(
            `The operationId "${operation.operationId}" is duplicated in your schema definition!`
          );
        }

        operationIds.push(operationId);
        operation.tags?.forEach((tag) => {
          if (!operationByTags[tag]) operationByTags[tag] = [];
          operationByTags[tag].push(operationId);
        });

        const {
          dataType,
          requestBodyType,
          pathParamsType,
          variablesType,
          queryParamsType,
          headersType,
          declarationNodes,
        } = getOperationTypes({
          openAPIDocument: context.openAPIDocument,
          operation,
          operationId,
          printNodes,
          injectedHeaders: config.injectedHeaders,
          pathParameters: verbs.parameters,
          variablesExtraPropsType,
        });

        nodes.push(
          ...declarationNodes,
          ...createOperationFetcherFnNodes({
            dataType,
            requestBodyType,
            pathParamsType,
            variablesType,
            queryParamsType,
            headersType,
            operation,
            fetcherFn,
            url: route,
            verb,
            name: operationId,
          })
        );
      });
    }
  );

  const operationDictionary = f.createVariableStatement(
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    f.createVariableDeclarationList(
      [
        f.createVariableDeclaration(
          f.createIdentifier("operationsByTag"),
          undefined,
          undefined,
          f.createObjectLiteralExpression(
            Object.entries(operationByTags).map(([tag, operationIds]) => {
              return f.createPropertyAssignment(
                f.createStringLiteral(c.camel(tag)),
                f.createObjectLiteralExpression(
                  operationIds.map((operationId) =>
                    f.createShorthandPropertyAssignment(operationId)
                  )
                )
              );
            })
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );

  await context.writeFile(
    filename + ".ts",
    printNodes([
      createWatermark(context.openAPIDocument.info),
      createNamedImport(fetcherImports, `./${fetcherFilename}`),
      ...getUsedImports(nodes, config.schemasFiles),
      ...nodes,
      operationDictionary,
    ])
  );
};
