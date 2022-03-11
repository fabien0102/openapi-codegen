import ts, { factory as f } from "typescript";
import * as c from "case";

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
import { get } from "lodash";

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
    c.snake(config.filenamePrefix || context.openAPIDocument.info.title) + "-";
  const formatFilename = config.filenameCase ? c[config.filenameCase] : c.camel;

  const filename = formatFilename(filenamePrefix + "-components");

  const fetcherFn = c.camel(`${filenamePrefix}-fetch`);
  const contextTypeName = `${c.pascal(filenamePrefix)}Context`;
  const contextHookName = `use${c.pascal(filenamePrefix)}Context`;
  const nodes: ts.Node[] = [];
  const keyManagerItems: [string, ts.Expression][] = [];

  const fetcherFilename = formatFilename(filenamePrefix + "-fetcher");
  const contextFilename = formatFilename(filenamePrefix + "-context");

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
    context.writeFile(`${contextFilename}.ts`, getContext(filenamePrefix));
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
          keyManagerItems.push([
            operationId,

            f.createArrowFunction(
              undefined,
              undefined,
              [
                f.createParameterDeclaration(
                  undefined,
                  undefined,
                  undefined,
                  f.createIdentifier("variables"),
                  undefined,
                  f.createIntersectionTypeNode(
                    compactNodes([
                      pathParamsType,
                      queryParamsType,
                      requestBodyType,
                    ])
                  ),
                  undefined
                ),
              ],
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createArrayLiteralExpression([
                f.createStringLiteral(operationId),
                f.createSpreadElement(
                  f.createCallExpression(
                    f.createPropertyAccessExpression(
                      f.createIdentifier("Object"),
                      f.createIdentifier("values")
                    ),
                    undefined,
                    [f.createIdentifier("variables")]
                  )
                ),
              ])
            ),
          ]);
        }

        nodes.push(
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

  const queryKeyManager = f.createVariableStatement(
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    f.createVariableDeclarationList(
      [
        f.createVariableDeclaration(
          f.createIdentifier("queryKeyManager"),
          undefined,
          undefined,
          f.createObjectLiteralExpression(
            keyManagerItems.map(([key, node]) =>
              f.createPropertyAssignment(key, node)
            )
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
      createReactQueryImport(),
      createNamedImport(
        [contextHookName, contextTypeName],
        `./${contextFilename}`
      ),
      createNamedImport(fetcherFn, `./${fetcherFilename}`),
      ...getUsedImports(nodes, config.schemasFiles),
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
                        f.createArrowFunction(
                          undefined,
                          undefined,
                          [
                            f.createParameterDeclaration(
                              undefined,
                              undefined,
                              undefined,
                              f.createIdentifier("variables"),
                              undefined,
                              variablesType,
                              undefined
                            ),
                          ],
                          undefined,
                          f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
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
                        ),
                        f.createIdentifier("options"),
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
                  undefined,
                  f.createIdentifier("queryKey"),
                  undefined,
                  f.createTypeReferenceNode(
                    f.createQualifiedName(
                      f.createIdentifier("reactQuery"),
                      f.createIdentifier("QueryKey")
                    ),
                    undefined
                  ),
                  undefined
                ),
                f.createParameterDeclaration(
                  undefined,
                  undefined,
                  undefined,
                  f.createIdentifier("variables"),
                  undefined,
                  variablesType
                ),
                f.createParameterDeclaration(
                  undefined,
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
                    [dataType, errorType, dataType],
                    [
                      f.createCallExpression(
                        f.createIdentifier("queryKeyFn"),
                        undefined,
                        [f.createIdentifier("queryKey")]
                      ),
                      f.createArrowFunction(
                        undefined,
                        undefined,
                        [],
                        undefined,
                        f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
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
                      ),
                      f.createObjectLiteralExpression(
                        [
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
      [dataType, errorType, dataType]
    ),
    f.createUnionTypeNode([
      f.createLiteralTypeNode(f.createStringLiteral("queryKey")),
      f.createLiteralTypeNode(f.createStringLiteral("queryFn")),
    ]),
  ]);

const createReactQueryImport = () =>
  f.createImportDeclaration(
    undefined,
    undefined,
    f.createImportClause(
      false,
      undefined,
      f.createNamespaceImport(f.createIdentifier("reactQuery"))
    ),
    f.createStringLiteral("react-query"),
    undefined
  );

function compactNodes(nodes: ts.TypeNode[]): readonly ts.TypeNode[] {
  // TODO: Remove empty {}
  return nodes.filter(
    (node) =>
      node !== undefined &&
      node.kind !== ts.SyntaxKind.UndefinedKeyword &&
      node.kind !== ts.SyntaxKind.NullKeyword
  );
}
