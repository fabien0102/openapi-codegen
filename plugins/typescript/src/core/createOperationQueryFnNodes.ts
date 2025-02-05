import { camelCase } from "lodash";
import { OperationObject } from "openapi3-ts";
import ts, { factory as f } from "typescript";
import { camelizedPathParams } from "./camelizedPathParams";

/**
 * Create the declaration of the react-router queries.
 *
 * @returns Array of nodes
 */
export const createOperationQueryFnNodes = ({
  operationFetcherFnName,
  dataType,
  variablesType,
  operation,
  operationId,
  url,
  verb, // TODO: Check if we need a different implementation for GET
  name,
}: {
  operationFetcherFnName: string;
  dataType: ts.TypeNode;
  variablesType: ts.TypeNode;
  operation: OperationObject;
  operationId: string;
  url: string;
  verb: string;
  name: string;
}) => {
  const nodes: ts.Node[] = [];
  if (operation.description?.trim()) {
    nodes.push(f.createJSDocComment(operation.description.trim(), []));
  }

  /**
   * Generate the function signature without SkipToken:
   *
   * ```
   * export function name(variables: VariableType): {
   *  queryKey: reactQuery.QueryKey;
   *  queryFn: (options: QueryFnOptions) => Promise<DataType>;
   * };
   * ```
   */
  nodes.push(
    f.createFunctionDeclaration(
      [f.createToken(ts.SyntaxKind.ExportKeyword)],
      undefined,
      f.createIdentifier(camelCase(name)),
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
      f.createTypeLiteralNode([
        f.createPropertySignature(
          undefined,
          f.createIdentifier("queryKey"),
          undefined,
          f.createTypeReferenceNode(
            f.createQualifiedName(
              f.createIdentifier("reactQuery"),
              f.createIdentifier("QueryKey")
            ),
            undefined
          )
        ),
        f.createPropertySignature(
          undefined,
          f.createIdentifier("queryFn"),
          undefined,
          f.createFunctionTypeNode(
            undefined,
            [
              f.createParameterDeclaration(
                undefined,
                undefined,
                f.createIdentifier("options"),
                undefined,
                f.createTypeReferenceNode(
                  f.createIdentifier("QueryFnOptions"),
                  undefined
                ),
                undefined
              ),
            ],
            f.createTypeReferenceNode(f.createIdentifier("Promise"), [dataType])
          )
        ),
      ]),
      undefined
    )
  );

  /**
   * Generate the function signature with SkipToken
   *
   * ```
   * export function name(
   *  variables: VariableType | reactQuery.SkipToken
   * ): {
   *   queryKey: reactQuery.QueryKey;
   *   queryFn:
   *     | ((options: QueryFnOptions) => Promise<DataType>)
   *     | reactQuery.SkipToken;
   * };
   * ```
   */
  nodes.push(
    f.createFunctionDeclaration(
      [f.createToken(ts.SyntaxKind.ExportKeyword)],
      undefined,
      f.createIdentifier(camelCase(name)),
      undefined,
      [
        f.createParameterDeclaration(
          undefined,
          undefined,
          f.createIdentifier("variables"),
          undefined,
          f.createUnionTypeNode([
            variablesType,
            f.createTypeReferenceNode(
              f.createQualifiedName(
                f.createIdentifier("reactQuery"),
                f.createIdentifier("SkipToken")
              ),
              undefined
            ),
          ]),
          undefined
        ),
      ],
      f.createTypeLiteralNode([
        f.createPropertySignature(
          undefined,
          f.createIdentifier("queryKey"),
          undefined,
          f.createTypeReferenceNode(
            f.createQualifiedName(
              f.createIdentifier("reactQuery"),
              f.createIdentifier("QueryKey")
            ),
            undefined
          )
        ),
        f.createPropertySignature(
          undefined,
          f.createIdentifier("queryFn"),
          undefined,
          f.createUnionTypeNode([
            f.createParenthesizedType(
              f.createFunctionTypeNode(
                undefined,
                [
                  f.createParameterDeclaration(
                    undefined,
                    undefined,
                    f.createIdentifier("options"),
                    undefined,
                    f.createTypeReferenceNode(
                      f.createIdentifier("QueryFnOptions"),
                      undefined
                    ),
                    undefined
                  ),
                ],
                f.createTypeReferenceNode(f.createIdentifier("Promise"), [
                  dataType,
                ])
              )
            ),
            f.createTypeReferenceNode(
              f.createQualifiedName(
                f.createIdentifier("reactQuery"),
                f.createIdentifier("SkipToken")
              ),
              undefined
            ),
          ])
        ),
      ]),
      undefined
    )
  );

  /**
   * Generate the function implementation
   *
   * ```
   * export function name(
   *   variables: VariableType | reactQuery.SkipToken
   * ) {
   *  return {
   *     queryKey: queryKeyFn({
   *       path: "/pet/findByStatus",
   *       operationId: "findPetsByStatus",
   *       variables,
   *     }),
   *     queryFn:
   *       variables === reactQuery.skipToken
   *         ? reactQuery.skipToken
   *         : ({ signal }: QueryFnOptions) =>
   *             fetchFindPetsByStatus(variables, signal),
   *   };
   * }
   * ```
   */
  nodes.push(
    f.createFunctionDeclaration(
      [f.createToken(ts.SyntaxKind.ExportKeyword)],
      undefined,
      f.createIdentifier(camelCase(name)),
      undefined,
      [
        f.createParameterDeclaration(
          undefined,
          undefined,
          f.createIdentifier("variables"),
          undefined,
          f.createUnionTypeNode([
            variablesType,
            f.createTypeReferenceNode(
              f.createQualifiedName(
                f.createIdentifier("reactQuery"),
                f.createIdentifier("SkipToken")
              ),
              undefined
            ),
          ]),
          undefined
        ),
      ],
      undefined,
      f.createBlock(
        [
          f.createReturnStatement(
            f.createObjectLiteralExpression(
              [
                f.createPropertyAssignment(
                  f.createIdentifier("queryKey"),
                  f.createCallExpression(
                    f.createIdentifier("queryKeyFn"),
                    undefined,
                    [
                      f.createObjectLiteralExpression(
                        [
                          f.createPropertyAssignment(
                            f.createIdentifier("path"),
                            f.createStringLiteral(camelizedPathParams(url))
                          ),
                          f.createPropertyAssignment(
                            f.createIdentifier("operationId"),
                            f.createStringLiteral(operationId)
                          ),
                          f.createShorthandPropertyAssignment(
                            f.createIdentifier("variables"),
                            undefined
                          ),
                        ],
                        true
                      ),
                    ]
                  )
                ),
                f.createPropertyAssignment(
                  f.createIdentifier("queryFn"),
                  f.createConditionalExpression(
                    f.createBinaryExpression(
                      f.createIdentifier("variables"),
                      f.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                      f.createPropertyAccessExpression(
                        f.createIdentifier("reactQuery"),
                        f.createIdentifier("skipToken")
                      )
                    ),
                    f.createToken(ts.SyntaxKind.QuestionToken),
                    f.createPropertyAccessExpression(
                      f.createIdentifier("reactQuery"),
                      f.createIdentifier("skipToken")
                    ),
                    f.createToken(ts.SyntaxKind.ColonToken),
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
                              f.createIdentifier("signal"),
                              undefined
                            ),
                          ]),
                          undefined,
                          f.createTypeReferenceNode(
                            f.createIdentifier("QueryFnOptions"),
                            undefined
                          ),
                          undefined
                        ),
                      ],
                      undefined,
                      f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                      f.createCallExpression(
                        f.createIdentifier(operationFetcherFnName),
                        undefined,
                        [
                          f.createIdentifier("variables"),
                          f.createIdentifier("signal"),
                        ]
                      )
                    )
                  )
                ),
              ],
              true
            )
          ),
        ],
        true
      )
    )
  );

  return nodes;
};
