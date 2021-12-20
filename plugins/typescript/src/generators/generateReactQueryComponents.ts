import ts, { factory as f } from "typescript";
import * as c from "case";

import { ConfigBase, Context } from "./types";
import {
  ComponentsObject,
  isReferenceObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
} from "openapi3-ts";
import { get, groupBy, uniqBy } from "lodash";
import {
  getType,
  schemaToTypeAliasDeclaration,
} from "../core/schemaToTypeAliasDeclaration";
import { findCompatibleMediaType } from "../core/findCompatibleMediaType";
import { getUsedImports } from "../core/getUsedImports";
import { getCustomFetcher } from "../templates/customFetcher";

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
  const nodes: ts.Node[] = [];

  const fetcherFilename = formatFilename(filenamePrefix + "-fetcher");
  if (!context.existsFile(fetcherFilename)) {
    context.writeFile(
      `${fetcherFilename}.ts`,
      printNodes(getCustomFetcher(filenamePrefix))
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

        // Retrieve dataType
        const dataType = getResponseType({
          responses: operation.responses,
          components: context.openAPIDocument.components,
          filter: (statusCode) => statusCode.startsWith("2"),
          printNodes,
        });

        // Retrieve errorType
        const errorType = getResponseType({
          responses: operation.responses,
          components: context.openAPIDocument.components,
          filter: (statusCode) => !statusCode.startsWith("2"),
          printNodes,
        });

        // Generate params types
        const { pathParams, queryParams, headerParams } = getParamsGroupByType(
          [...(verbs.parameters || []), ...(operation.parameters || [])],
          context.openAPIDocument.components
        );

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

        const operationFetcherFnName = `fetch${c.pascal(operationId)}`;
        nodes.push(
          ...createOperationFetcherFnNodes({
            dataType,
            pathParamsType:
              pathParams.length > 0
                ? f.createTypeReferenceNode(
                    `${c.pascal(operationId)}PathParams`
                  )
                : undefined,
            queryParamsType:
              queryParams.length > 0
                ? f.createTypeReferenceNode(
                    `${c.pascal(operationId)}QueryParams`
                  )
                : undefined,
            headersType:
              headerParams.length > 0
                ? f.createTypeReferenceNode(`${c.pascal(operationId)}Headers`)
                : undefined,
            operation,
            fetcherFn,
            url: route,
            verb,
            name: operationFetcherFnName,
          }),
          ...createOperationHook({
            operationFetcherFnName,
            operation,
            dataType,
            errorType,
            name: `use${c.pascal(operationId)}`,
          })
        );
      });
    }
  );

  await context.writeFile(
    filename + ".ts",
    printNodes([
      createReactQueryImports(["useQuery", "QueryKey", "UseQueryOptions"]),
      createFetcherFnImport(fetcherFn, `./${fetcherFn}`),
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
 * Resolve $ref and group parameters by `type`.
 *
 * @param parameters Operation parameters
 * @param components #/components
 */
const getParamsGroupByType = (
  parameters: OperationObject["parameters"] = [],
  components: ComponentsObject = {}
) => {
  const {
    query: queryParams = [],
    path: pathParams = [],
    header: headerParams = [],
  } = groupBy(
    [...parameters].map<ParameterObject>((p) => {
      if (isReferenceObject(p)) {
        const schema = get(
          components,
          p.$ref.replace("#/components/", "").replace("/", ".")
        );
        if (!schema) {
          throw new Error(`${p.$ref} not found!`);
        }
        return schema;
      } else {
        return p;
      }
    }),
    "in"
  );

  return { queryParams, pathParams, headerParams };
};

/**
 * Convert a list of params in an object schema.
 *
 * @param params Parameters list
 * @param optionalKeys Override the key to be optional
 * @returns An openAPI object schemas with the parameters as properties
 */
const paramsToSchema = (
  params: ParameterObject[],
  optionalKeys: string[] = []
): SchemaObject => {
  return {
    type: "object",
    properties: params.reduce((mem, param) => {
      return {
        ...mem,
        [param.name]: { ...param.schema, description: param.description },
      };
    }, {}),
    required: params
      .filter((p) => p.required && !optionalKeys.includes(p.name))
      .map((p) => p.name),
  };
};

/**
 * Extract types from responses
 */
const getResponseType = ({
  responses,
  components,
  filter,
  printNodes,
}: {
  responses: ResponsesObject;
  components?: ComponentsObject;
  filter: (statusCode: string) => boolean;
  printNodes: (nodes: ts.Node[]) => string;
}) => {
  const responseTypes = uniqBy(
    Object.entries(responses).reduce(
      (
        mem,
        [statusCode, response]: [string, ResponseObject | ReferenceObject]
      ) => {
        if (!filter(statusCode)) return mem;
        if (isReferenceObject(response)) {
          const [hash, topLevel, namespace, name] = response.$ref.split("/");
          if (hash !== "#" || topLevel !== "components") {
            throw new Error(
              "This library only resolve $ref that are include into `#/components/*` for now"
            );
          }
          if (namespace !== "responses") {
            throw new Error(
              "$ref for responses must be on `#/components/responses`"
            );
          }
          return [
            ...mem,
            f.createTypeReferenceNode(
              f.createQualifiedName(
                f.createIdentifier("Responses"),
                f.createIdentifier(name)
              ),
              undefined
            ),
          ];
        }

        const mediaType = findCompatibleMediaType(response);
        if (!mediaType || !mediaType.schema) return mem;

        return [
          ...mem,
          getType(mediaType.schema, {
            currentComponent: null,
            openAPIDocument: { components },
          }),
        ];
      },
      [] as ts.TypeNode[]
    ),
    (node) => printNodes([node])
  );

  return responseTypes.length === 0
    ? f.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    : responseTypes.length === 1
    ? responseTypes[0]
    : f.createUnionTypeNode(responseTypes);
};

/**
 * Create the declaration of the fetcher function.
 *
 * @returns Array of nodes
 */
const createOperationFetcherFnNodes = ({
  dataType,
  bodyType,
  queryParamsType,
  pathParamsType,
  headersType,
  fetcherFn,
  operation,
  url,
  verb,
  name,
}: {
  dataType: ts.TypeNode;
  bodyType?: ts.TypeNode;
  headersType?: ts.TypeNode;
  pathParamsType?: ts.TypeNode;
  queryParamsType?: ts.TypeNode;
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
  const optionsProperties: ts.TypeElement[] = [];

  if (bodyType) {
    optionsProperties.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("body"),
        undefined,
        bodyType
      )
    );
  }
  if (headersType) {
    optionsProperties.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("headers"),
        undefined,
        headersType
      )
    );
  }
  if (pathParamsType) {
    optionsProperties.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("pathParams"),
        undefined,
        pathParamsType
      )
    );
  }
  if (queryParamsType) {
    optionsProperties.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("queryParams"),
        undefined,
        queryParamsType
      )
    );
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
              optionsProperties.length > 0
                ? [
                    f.createParameterDeclaration(
                      undefined,
                      undefined,
                      undefined,
                      f.createIdentifier("options"),
                      undefined,
                      f.createTypeLiteralNode(optionsProperties),
                      undefined
                    ),
                  ]
                : [],
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createCallExpression(
                f.createIdentifier(fetcherFn),
                [dataType],
                [
                  f.createObjectLiteralExpression(
                    [
                      f.createPropertyAssignment(
                        f.createIdentifier("url"),
                        f.createStringLiteral(url)
                      ),
                      f.createPropertyAssignment(
                        f.createIdentifier("method"),
                        f.createStringLiteral(verb)
                      ),
                      ...(optionsProperties.length > 0
                        ? [
                            f.createSpreadAssignment(
                              f.createIdentifier("options")
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

const createOperationHook = ({
  operationFetcherFnName,
  dataType,
  errorType,
  name,
  operation,
}: {
  operationFetcherFnName: string;
  name: string;
  dataType: ts.TypeNode;
  errorType: ts.TypeNode;
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
                    f.createIdentifier("QueryKey"),
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
                  f.createIdentifier("options"),
                  f.createToken(ts.SyntaxKind.QuestionToken),
                  createUseQueryOptionsType(dataType, errorType)
                ),
              ],
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createCallExpression(
                f.createIdentifier("useQuery"),
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
                  f.createIdentifier(operationFetcherFnName),
                  f.createIdentifier("options"),
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

const createUseQueryOptionsType = (
  dataType: ts.TypeNode,
  errorType: ts.TypeNode
) =>
  f.createTypeReferenceNode(f.createIdentifier("Omit"), [
    f.createTypeReferenceNode(f.createIdentifier("UseQueryOptions"), [
      dataType,
      errorType,
      dataType,
      f.createTypeReferenceNode(f.createIdentifier("TQueryKey"), undefined),
    ]),
    f.createUnionTypeNode([
      f.createLiteralTypeNode(f.createStringLiteral("queryKey")),
      f.createLiteralTypeNode(f.createStringLiteral("queryFn")),
    ]),
  ]);

const createReactQueryImports = (keys: string[]) =>
  f.createImportDeclaration(
    undefined,
    undefined,
    f.createImportClause(
      false,
      undefined,
      f.createNamedImports(
        keys.map((key) =>
          f.createImportSpecifier(false, undefined, f.createIdentifier(key))
        )
      )
    ),
    f.createStringLiteral("react-query"),
    undefined
  );

const createFetcherFnImport = (fnName: string, filename: string) =>
  f.createImportDeclaration(
    undefined,
    undefined,
    f.createImportClause(false, f.createIdentifier(fnName), undefined),
    f.createStringLiteral(filename),
    undefined
  );
