import ts, { factory as f } from "typescript";
import * as c from "case";
import { get } from "lodash";

import { ConfigBase, Context } from "./types";
import { OperationObject, PathItemObject } from "openapi3-ts";

import { getUsedImports } from "../core/getUsedImports";
import { createWatermark } from "../core/createWatermark";
import { createOperationFetcherFnNodes } from "../core/createOperationFetcherFnNodes";
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

export const generateReactQueryComponents = async (
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

  const filename = formatFilename(filenamePrefix + "-components");

  const fetcherFn = c.camel(`${filenamePrefix}-fetch`);
  const contextTypeName = `${c.pascal(filenamePrefix)}Context`;
  const contextHookName = `use${c.pascal(filenamePrefix)}Context`;
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

        nodes.push(...declarationNodes);

        const operationFetcherFnName = `fetch${c.pascal(operationId)}`;
        const component: "useQuery" | "useMutate" =
          operation["x-openapi-codegen-component"] ||
          (verb === "get" ? "useQuery" : "useMutate");

        if (!["useQuery", "useMutate"].includes(component)) {
          throw new Error(`[x-openapi-codegen-component] Invalid value for ${operation.operationId} operation
          Valid options: "useMutate", "useQuery"`);
        }

        if (component === "useQuery") {
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
        }

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
          ...(component === "useQuery"
            ? createQueryHook({
                operationFetcherFnName,
                operation,
                dataType,
                errorType,
                variablesType,
                contextHookName,
                name: `use${c.pascal(operationId)}`,
                operationId,
                url: route,
              })
            : createMutationHook({
                operationFetcherFnName,
                operation,
                dataType,
                errorType,
                variablesType,
                contextHookName,
                name: `use${c.pascal(operationId)}`,
              }))
        );
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
        [contextHookName, contextTypeName],
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

const createMutationHook = ({
  operationFetcherFnName,
  contextHookName,
  dataType,
  errorType,
  variablesType,
  name,
  operation,
}: {
  operationFetcherFnName: string;
  contextHookName: string;
  name: string;
  dataType: ts.TypeNode;
  errorType: ts.TypeNode;
  variablesType: ts.TypeNode;
  operation: OperationObject;
}) => {
  const nodes: ts.Node[] = [];
  if (operation.description) {
    nodes.push(f.createJSDocComment(operation.description.trim(), []));
  }

  nodes.push(
    f.createVariableStatement(
      [f.createModifier(ts.SyntaxKind.ExportKeyword)],
      f.createVariableDeclarationList(
        [
          f.createVariableDeclaration(
            f.createIdentifier(name),
            undefined,
            undefined,
            f.createArrowFunction(
              undefined,
              undefined,
              [
                f.createParameterDeclaration(
                  undefined,
                  undefined,
                  f.createIdentifier("options"),
                  f.createToken(ts.SyntaxKind.QuestionToken),
                  f.createTypeReferenceNode(f.createIdentifier("Omit"), [
                    f.createTypeReferenceNode(
                      f.createQualifiedName(
                        f.createIdentifier("reactQuery"),
                        f.createIdentifier("UseMutationOptions")
                      ),
                      [dataType, errorType, variablesType]
                    ),
                    f.createLiteralTypeNode(
                      f.createStringLiteral("mutationFn")
                    ),
                  ]),
                  undefined
                ),
              ],
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createBlock(
                [
                  f.createVariableStatement(
                    undefined,
                    f.createVariableDeclarationList(
                      [
                        f.createVariableDeclaration(
                          f.createObjectBindingPattern([
                            f.createBindingElement(
                              undefined,
                              undefined,
                              f.createIdentifier("fetcherOptions"),
                              undefined
                            ),
                          ]),
                          undefined,
                          undefined,
                          f.createCallExpression(
                            f.createIdentifier(contextHookName),
                            undefined,
                            []
                          )
                        ),
                      ],
                      ts.NodeFlags.Const
                    )
                  ),
                  f.createReturnStatement(
                    f.createCallExpression(
                      f.createPropertyAccessExpression(
                        f.createIdentifier("reactQuery"),
                        f.createIdentifier("useMutation")
                      ),
                      [dataType, errorType, variablesType],
                      [
                        f.createObjectLiteralExpression(
                          [
                            f.createPropertyAssignment(
                              "mutationFn",
                              f.createArrowFunction(
                                undefined,
                                undefined,
                                [
                                  f.createParameterDeclaration(
                                    undefined,
                                    undefined,
                                    f.createIdentifier("variables"),
                                    undefined,
                                    variablesType,
                                    undefined
                                  ),
                                ],
                                undefined,
                                f.createToken(
                                  ts.SyntaxKind.EqualsGreaterThanToken
                                ),
                                f.createCallExpression(
                                  f.createIdentifier(operationFetcherFnName),
                                  undefined,
                                  [
                                    f.createObjectLiteralExpression(
                                      [
                                        f.createSpreadAssignment(
                                          f.createIdentifier("fetcherOptions")
                                        ),
                                        f.createSpreadAssignment(
                                          f.createIdentifier("variables")
                                        ),
                                      ],
                                      false
                                    ),
                                  ]
                                )
                              )
                            ),
                            f.createSpreadAssignment(
                              f.createIdentifier("options")
                            ),
                          ],
                          true
                        ),
                      ]
                    )
                  ),
                ],
                true
              )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  return nodes;
};

const createQueryHook = ({
  operationFetcherFnName,
  contextHookName,
  dataType,
  errorType,
  variablesType,
  name,
  operationId,
  operation,
  url,
}: {
  operationFetcherFnName: string;
  contextHookName: string;
  name: string;
  operationId: string;
  url: string;
  dataType: ts.TypeNode;
  errorType: ts.TypeNode;
  variablesType: ts.TypeNode;
  operation: OperationObject;
}) => {
  const nodes: ts.Node[] = [];
  if (operation.description) {
    nodes.push(f.createJSDocComment(operation.description.trim(), []));
  }
  nodes.push(
    f.createVariableStatement(
      [f.createModifier(ts.SyntaxKind.ExportKeyword)],
      f.createVariableDeclarationList(
        [
          f.createVariableDeclaration(
            f.createIdentifier(name),
            undefined,
            undefined,
            f.createArrowFunction(
              undefined,
              [
                f.createTypeParameterDeclaration(
                  undefined,
                  "TData",
                  undefined,
                  dataType
                ),
              ],
              [
                f.createParameterDeclaration(
                  undefined,
                  undefined,
                  f.createIdentifier("variables"),
                  undefined,
                  variablesType
                ),
                f.createParameterDeclaration(
                  undefined,
                  undefined,
                  f.createIdentifier("options"),
                  f.createToken(ts.SyntaxKind.QuestionToken),
                  createUseQueryOptionsType(dataType, errorType)
                ),
              ],
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createBlock([
                f.createVariableStatement(
                  undefined,
                  f.createVariableDeclarationList(
                    [
                      f.createVariableDeclaration(
                        f.createObjectBindingPattern([
                          f.createBindingElement(
                            undefined,
                            undefined,
                            f.createIdentifier("fetcherOptions"),
                            undefined
                          ),
                          f.createBindingElement(
                            undefined,
                            undefined,
                            f.createIdentifier("queryOptions"),
                            undefined
                          ),
                          f.createBindingElement(
                            undefined,
                            undefined,
                            f.createIdentifier("queryKeyFn"),
                            undefined
                          ),
                        ]),
                        undefined,
                        undefined,
                        f.createCallExpression(
                          f.createIdentifier(contextHookName),
                          undefined,
                          [f.createIdentifier("options")]
                        )
                      ),
                    ],
                    ts.NodeFlags.Const
                  )
                ),
                f.createReturnStatement(
                  f.createCallExpression(
                    f.createPropertyAccessExpression(
                      f.createIdentifier("reactQuery"),
                      f.createIdentifier("useQuery")
                    ),
                    [
                      dataType,
                      errorType,
                      f.createTypeReferenceNode(
                        f.createIdentifier("TData"),
                        []
                      ),
                    ],
                    [
                      f.createObjectLiteralExpression(
                        [
                          f.createPropertyAssignment(
                            "queryKey",
                            f.createCallExpression(
                              f.createIdentifier("queryKeyFn"),
                              undefined,
                              [
                                f.createObjectLiteralExpression([
                                  f.createPropertyAssignment(
                                    "path",
                                    f.createStringLiteral(
                                      camelizedPathParams(url)
                                    )
                                  ),
                                  f.createPropertyAssignment(
                                    "operationId",
                                    f.createStringLiteral(operationId)
                                  ),
                                  f.createShorthandPropertyAssignment(
                                    f.createIdentifier("variables")
                                  ),
                                ]),
                              ]
                            )
                          ),
                          f.createPropertyAssignment(
                            "queryFn",
                            f.createArrowFunction(
                              undefined,
                              undefined,
                              [
                                f.createParameterDeclaration(
                                  undefined,
                                  undefined,
                                  f.createObjectBindingPattern([
                                    f.createBindingElement(
                                      undefined,
                                      undefined,
                                      "signal"
                                    ),
                                  ])
                                ),
                              ],
                              undefined,
                              f.createToken(
                                ts.SyntaxKind.EqualsGreaterThanToken
                              ),
                              f.createCallExpression(
                                f.createIdentifier(operationFetcherFnName),
                                undefined,
                                [
                                  f.createObjectLiteralExpression(
                                    [
                                      f.createSpreadAssignment(
                                        f.createIdentifier("fetcherOptions")
                                      ),
                                      f.createSpreadAssignment(
                                        f.createIdentifier("variables")
                                      ),
                                    ],
                                    false
                                  ),
                                  f.createIdentifier("signal"),
                                ]
                              )
                            )
                          ),
                          f.createSpreadAssignment(
                            f.createIdentifier("options")
                          ),
                          f.createSpreadAssignment(
                            f.createIdentifier("queryOptions")
                          ),
                        ],
                        true
                      ),
                    ]
                  )
                ),
              ])
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );

  return nodes;
};

const createUseQueryOptionsType = (
  dataType: ts.TypeNode,
  errorType: ts.TypeNode
) =>
  f.createTypeReferenceNode(f.createIdentifier("Omit"), [
    f.createTypeReferenceNode(
      f.createQualifiedName(
        f.createIdentifier("reactQuery"),
        f.createIdentifier("UseQueryOptions")
      ),
      [
        dataType,
        errorType,
        f.createTypeReferenceNode(f.createIdentifier("TData"), []),
      ]
    ),
    f.createUnionTypeNode([
      f.createLiteralTypeNode(f.createStringLiteral("queryKey")),
      f.createLiteralTypeNode(f.createStringLiteral("queryFn")),
      f.createLiteralTypeNode(f.createStringLiteral("initialData")),
    ]),
  ]);

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
