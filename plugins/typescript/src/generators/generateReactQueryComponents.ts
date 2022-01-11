import ts, { factory as f } from "typescript";
import * as c from "case";

import { ConfigBase, Context } from "./types";
import { OperationObject, PathItemObject } from "openapi3-ts";

import { schemaToTypeAliasDeclaration } from "../core/schemaToTypeAliasDeclaration";
import { getUsedImports } from "../core/getUsedImports";
import { getVariablesType } from "../core/getVariablesType";
import { paramsToSchema } from "../core/paramsToSchema";
import { getResponseType } from "../core/getResponseType";
import { getRequestBodyType } from "../core/getRequestBodyType";
import { getParamsGroupByType } from "../core/getParamsGroupByType";
import { isRequestBodyOptional } from "../core/isRequestBodyOptional";
import { createWatermark } from "../core/createWatermark";

import { getCustomFetcher } from "../templates/customFetcher";
import { getContext } from "../templates/context";

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

  const fetcherFilename = formatFilename(filenamePrefix + "-fetcher");
  const contextFilename = formatFilename(filenamePrefix + "-context");

  if (!context.existsFile(`${fetcherFilename}.ts`)) {
    context.writeFile(
      `${fetcherFilename}.ts`,
      getCustomFetcher(filenamePrefix, contextFilename)
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

        // Retrieve dataType
        let dataType = getResponseType({
          responses: operation.responses,
          components: context.openAPIDocument.components,
          filter: (statusCode) => statusCode.startsWith("2"),
          printNodes,
        });

        // Retrieve errorType
        let errorType = getResponseType({
          responses: operation.responses,
          components: context.openAPIDocument.components,
          filter: (statusCode) => !statusCode.startsWith("2"),
          printNodes,
        });

        // Retrieve requestBodyType
        let requestBodyType = getRequestBodyType({
          requestBody: operation.requestBody,
          components: context.openAPIDocument.components,
        });

        // Generate params types
        const { pathParams, queryParams, headerParams } = getParamsGroupByType(
          [...(verbs.parameters || []), ...(operation.parameters || [])],
          context.openAPIDocument.components
        );

        // Check if types can be marked as optional (all properties are optional)
        const requestBodyOptional = isRequestBodyOptional({
          requestBody: operation.requestBody,
          components: context.openAPIDocument.components,
        });
        const headersOptional = headerParams.reduce((mem, p) => {
          if ((config.injectedHeaders || []).includes(p.name)) return mem;
          return mem && !p.required;
        }, true);
        const pathParamsOptional = pathParams.reduce((mem, p) => {
          return mem && !p.required;
        }, true);
        const queryParamsOptional = queryParams.reduce((mem, p) => {
          return mem && !p.required;
        }, true);

        if (pathParams.length > 0) {
          nodes.push(
            ...schemaToTypeAliasDeclaration(
              `${operationId}PathParams`,
              paramsToSchema(pathParams),
              {
                currentComponent: null,
                openAPIDocument: context.openAPIDocument,
              }
            )
          );
        }

        if (queryParams.length > 0) {
          nodes.push(
            ...schemaToTypeAliasDeclaration(
              `${operationId}QueryParams`,
              paramsToSchema(queryParams),
              {
                currentComponent: null,
                openAPIDocument: context.openAPIDocument,
              }
            )
          );
        }

        if (headerParams.length > 0) {
          nodes.push(
            ...schemaToTypeAliasDeclaration(
              `${operationId}Headers`,
              paramsToSchema(headerParams, config.injectedHeaders),
              {
                currentComponent: null,
                openAPIDocument: context.openAPIDocument,
              }
            )
          );
        }

        // Export error type if needed
        if (shouldExtractNode(errorType)) {
          const errorTypeIdentifier = c.pascal(`${operationId}Error`);
          nodes.push(
            f.createTypeAliasDeclaration(
              undefined,
              [f.createModifier(ts.SyntaxKind.ExportKeyword)],
              f.createIdentifier(errorTypeIdentifier),
              undefined,
              errorType
            )
          );

          errorType = f.createTypeReferenceNode(errorTypeIdentifier);
        }

        // Export data type if needed
        if (shouldExtractNode(dataType)) {
          const dataTypeIdentifier = c.pascal(`${operationId}Response`);
          nodes.push(
            f.createTypeAliasDeclaration(
              undefined,
              [f.createModifier(ts.SyntaxKind.ExportKeyword)],
              f.createIdentifier(dataTypeIdentifier),
              undefined,
              dataType
            )
          );

          dataType = f.createTypeReferenceNode(dataTypeIdentifier);
        }

        // Export requestBody type if needed
        if (shouldExtractNode(requestBodyType)) {
          const requestBodyIdentifier = c.pascal(`${operationId}RequestBody`);
          nodes.push(
            f.createTypeAliasDeclaration(
              undefined,
              [f.createModifier(ts.SyntaxKind.ExportKeyword)],
              f.createIdentifier(requestBodyIdentifier),
              undefined,
              requestBodyType
            )
          );

          requestBodyType = f.createTypeReferenceNode(requestBodyIdentifier);
        }

        const pathParamsType =
          pathParams.length > 0
            ? f.createTypeReferenceNode(`${c.pascal(operationId)}PathParams`)
            : f.createTypeLiteralNode([]);

        const queryParamsType =
          queryParams.length > 0
            ? f.createTypeReferenceNode(`${c.pascal(operationId)}QueryParams`)
            : f.createTypeLiteralNode([]);

        const headersType =
          headerParams.length > 0
            ? f.createTypeReferenceNode(`${c.pascal(operationId)}Headers`)
            : f.createTypeLiteralNode([]);

        // Generate fetcher variables type
        const variablesIdentifier = c.pascal(`${operationId}Variables`);
        const variablesType = f.createTypeReferenceNode(variablesIdentifier);
        nodes.push(
          f.createTypeAliasDeclaration(
            undefined,
            [f.createModifier(ts.SyntaxKind.ExportKeyword)],
            f.createIdentifier(variablesIdentifier),
            undefined,
            getVariablesType({
              requestBodyType,
              headersType,
              pathParamsType,
              queryParamsType,
              contextTypeName,
              headersOptional,
              pathParamsOptional,
              queryParamsOptional,
              requestBodyOptional,
            })
          )
        );

        const operationFetcherFnName = `fetch${c.pascal(operationId)}`;
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
          ...(verb === "get"
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
    ])
  );
};

/**
 * Type guard for `OperationObject`
 *
 * @param obj
 */
const isOperationObject = (
  obj: any
): obj is OperationObject & { operationId: string } =>
  typeof obj === "object" && typeof (obj as any).operationId === "string";

const isVerb = (
  verb: string
): verb is "get" | "post" | "patch" | "put" | "delete" =>
  ["get", "post", "patch", "put", "delete"].includes(verb);

/**
 * Create the declaration of the fetcher function.
 *
 * @returns Array of nodes
 */
const createOperationFetcherFnNodes = ({
  dataType,
  requestBodyType,
  queryParamsType,
  pathParamsType,
  headersType,
  variablesType,
  fetcherFn,
  operation,
  url,
  verb,
  name,
}: {
  dataType: ts.TypeNode;
  requestBodyType: ts.TypeNode;
  headersType: ts.TypeNode;
  pathParamsType: ts.TypeNode;
  queryParamsType: ts.TypeNode;
  variablesType: ts.TypeNode;
  operation: OperationObject;
  fetcherFn: string;
  url: string;
  verb: string;
  name: string;
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
              variablesType.kind !== ts.SyntaxKind.VoidKeyword
                ? [
                    f.createParameterDeclaration(
                      undefined,
                      undefined,
                      undefined,
                      f.createIdentifier("variables"),
                      undefined,
                      variablesType,
                      undefined
                    ),
                  ]
                : [],
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createCallExpression(
                f.createIdentifier(fetcherFn),
                [
                  dataType,
                  requestBodyType,
                  headersType,
                  queryParamsType,
                  pathParamsType,
                ],
                [
                  f.createObjectLiteralExpression(
                    [
                      f.createPropertyAssignment(
                        f.createIdentifier("url"),
                        f.createStringLiteral(camelizedPathParams(url))
                      ),
                      f.createPropertyAssignment(
                        f.createIdentifier("method"),
                        f.createStringLiteral(verb)
                      ),
                      ...(variablesType.kind !== ts.SyntaxKind.VoidKeyword
                        ? [
                            f.createSpreadAssignment(
                              f.createIdentifier("variables")
                            ),
                          ]
                        : []),
                    ],
                    false
                  ),
                ]
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
                            f.createBindingElement(
                              undefined,
                              undefined,
                              f.createIdentifier("queryOptions"),
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
                        f.createObjectLiteralExpression(
                          [
                            f.createSpreadAssignment(
                              f.createIdentifier("queryOptions")
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
              [
                f.createTypeParameterDeclaration(
                  f.createIdentifier("TQueryKey"),
                  f.createTypeReferenceNode(
                    f.createQualifiedName(
                      f.createIdentifier("reactQuery"),
                      f.createIdentifier("QueryKey")
                    ),
                    undefined
                  ),
                  undefined
                ),
              ],
              [
                f.createParameterDeclaration(
                  undefined,
                  undefined,
                  undefined,
                  f.createIdentifier("queryKey"),
                  undefined,
                  f.createTypeReferenceNode(
                    f.createIdentifier("TQueryKey"),
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
                      f.createIdentifier("useQuery")
                    ),
                    [
                      dataType,
                      errorType,
                      dataType,
                      f.createTypeReferenceNode(
                        f.createIdentifier("TQueryKey"),
                        undefined
                      ),
                    ],
                    [
                      f.createIdentifier("queryKey"),
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
                            f.createIdentifier("queryOptions")
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
        dataType,
        f.createTypeReferenceNode(f.createIdentifier("TQueryKey"), undefined),
      ]
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

const createNamedImport = (fnName: string | string[], filename: string) => {
  const fnNames = Array.isArray(fnName) ? fnName : [fnName];
  return f.createImportDeclaration(
    undefined,
    undefined,
    f.createImportClause(
      false,
      undefined,
      f.createNamedImports(
        fnNames.map((name) =>
          f.createImportSpecifier(false, undefined, f.createIdentifier(name))
        )
      )
    ),
    f.createStringLiteral(filename),
    undefined
  );
};

/**
 * Define if the type should be extracted.
 */
const shouldExtractNode = (node: ts.Node) =>
  ts.isIntersectionTypeNode(node) ||
  (ts.isTypeLiteralNode(node) && node.members.length > 0) ||
  ts.isArrayTypeNode(node);

/**
 * Transform url params case to camel.
 *
 * @example
 * `pet/{pet_id}` -> `pet/{petId}`
 */
const camelizedPathParams = (url: string) =>
  url.replace(/\{\w*\}/g, (match) => `{${c.camel(match)}}`);
