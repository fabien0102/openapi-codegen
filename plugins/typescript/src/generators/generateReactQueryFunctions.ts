import ts, { factory as f } from "typescript";
import * as c from "case";
import { get } from "lodash";

import { ConfigBase, Context } from "./types";
import { PathItemObject } from "openapi3-ts";

import { getUsedImports } from "../core/getUsedImports";
import { createWatermark } from "../core/createWatermark";
import { createOperationFetcherFnNodes } from "../core/createOperationFetcherFnNodes";
import { createOperationQueryFnNodes } from "../core/createOperationQueryFnNodes";

import { isVerb } from "../core/isVerb";
import { isOperationObject } from "../core/isOperationObject";
import { getOperationTypes } from "../core/getOperationTypes";
import { createNamedImport } from "../core/createNamedImport";

import { getFetcher } from "../templates/fetcher";
import { getContext } from "../templates/context";
import { getUtils } from "../templates/utils";
import { createNamespaceImport } from "../core/createNamespaceImport";
import { camelizedPathParams } from "../core/camelizedPathParams";

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

export const generateReactQueryFunctions = async (
  context: Context,
  config: Config
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
    c.snake(config.filenamePrefix ?? context.openAPIDocument.info.title) + "-";

  const formatFilename =
    typeof config.formatFilename === "function"
      ? config.formatFilename
      : config.filenameCase
        ? c[config.filenameCase]
        : c.camel;

  const filename = formatFilename(filenamePrefix + "-functions");

  const fetcherFn = c.camel(`${filenamePrefix}-fetch`);
  const contextTypeName = `${c.pascal(filenamePrefix)}Context`;
  const nodes: ts.Node[] = [];
  const keyManagerItems: ts.TypeLiteralNode[] = [];

  const fetcherFilename = formatFilename(filenamePrefix + "-fetcher");
  const contextFilename = formatFilename(filenamePrefix + "-context");
  const utilsFilename = formatFilename(filenamePrefix + "-utils");

  if (!context.existsFile(`${fetcherFilename}.ts`)) {
    context.writeFile(
      `${fetcherFilename}.ts`,
      getFetcher({
        prefix: filenamePrefix,
        contextPath: contextFilename,
        baseUrl: get(context.openAPIDocument, "servers.0.url"),
      })
    );
  }

  if (!context.existsFile(`${contextFilename}.ts`)) {
    context.writeFile(
      `${contextFilename}.ts`,
      getContext(filenamePrefix, filename)
    );
  }

  // Generate `useQuery` & `useMutation`
  const operationIds: string[] = [];

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

        const {
          dataType,
          errorType,
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
          variablesExtraPropsType: f.createIndexedAccessTypeNode(
            f.createTypeReferenceNode(
              f.createIdentifier(contextTypeName),
              undefined
            ),
            f.createLiteralTypeNode(f.createStringLiteral("fetcherOptions"))
          ),
        });

        const operationFetcherFnName = `fetch${c.pascal(operationId)}`;
        const operationQueryFnName = `${c.pascal(operationId)}Query`;
        const component: "useQuery" | "useMutate" =
          operation["x-openapi-codegen-component"] ||
          (verb === "get" ? "useQuery" : "useMutate");

        if (!["useQuery", "useMutate"].includes(component)) {
          throw new Error(`[x-openapi-codegen-component] Invalid value for ${operation.operationId} operation
          Valid options: "useMutate", "useQuery"`);
        }

        if (component === "useQuery") {
          nodes.push(...declarationNodes);

          keyManagerItems.push(
            f.createTypeLiteralNode([
              f.createPropertySignature(
                undefined,
                f.createIdentifier("path"),
                undefined,
                f.createLiteralTypeNode(
                  f.createStringLiteral(camelizedPathParams(route))
                )
              ),
              f.createPropertySignature(
                undefined,
                f.createIdentifier("operationId"),
                undefined,
                f.createLiteralTypeNode(f.createStringLiteral(operationId))
              ),
              f.createPropertySignature(
                undefined,
                f.createIdentifier("variables"),
                undefined,
                variablesType
              ),
            ])
          );

          nodes.push(
            ...createOperationFetcherFnNodes({
              dataType,
              errorType,
              requestBodyType,
              pathParamsType,
              variablesType,
              queryParamsType,
              headersType,
              operation,
              fetcherFn,
              url: route,
              verb,
              name: operationFetcherFnName,
            }),
            ...createOperationQueryFnNodes({
              operationFetcherFnName,
              dataType,
              errorType,
              requestBodyType,
              pathParamsType,
              variablesType,
              queryParamsType,
              headersType,
              operation,
              fetcherFn,
              url: route,
              verb,
              name: operationQueryFnName,
            })
          );
        }
      });
    }
  );

  if (operationIds.length === 0) {
    console.log(`⚠️ You don't have any operation with "operationId" defined!`);
  }
  const queryKeyManager = f.createTypeAliasDeclaration(
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    "QueryOperation",
    undefined,
    keyManagerItems.length > 0
      ? f.createUnionTypeNode(keyManagerItems)
      : f.createTypeLiteralNode([
          f.createPropertySignature(
            undefined,
            f.createIdentifier("path"),
            undefined,
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
          ),
          f.createPropertySignature(
            undefined,
            f.createIdentifier("operationId"),
            undefined,
            f.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
          ),
          f.createPropertySignature(
            undefined,
            f.createIdentifier("variables"),
            undefined,
            f.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
          ),
        ])
  );

  const { nodes: usedImportsNodes, keys: usedImportsKeys } = getUsedImports(
    nodes,
    {
      ...config.schemasFiles,
      utils: utilsFilename,
    }
  );

  if (usedImportsKeys.includes("utils")) {
    await context.writeFile(`${utilsFilename}.ts`, getUtils());
  }

  await context.writeFile(
    filename + ".ts",
    printNodes([
      createWatermark(context.openAPIDocument.info),
      createReactQueryImport(),
      createNamedImport(
        [contextTypeName, "queryKeyFn"],
        `./${contextFilename}`
      ),
      createNamespaceImport("Fetcher", `./${fetcherFilename}`),
      createNamedImport(fetcherFn, `./${fetcherFilename}`),
      ...usedImportsNodes,
      ...nodes,
      queryKeyManager,
    ])
  );
};

const createReactQueryImport = () =>
  f.createImportDeclaration(
    undefined,
    f.createImportClause(
      false,
      undefined,
      f.createNamespaceImport(f.createIdentifier("reactQuery"))
    ),
    f.createStringLiteral("@tanstack/react-query"),
    undefined
  );
