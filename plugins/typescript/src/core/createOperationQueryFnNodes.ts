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
  errorType,
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
  operationFetcherFnName: string;
  dataType: ts.TypeNode;
  errorType: ts.TypeNode;
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
            f.createIdentifier(camelCase(name)),
            undefined,
            undefined,
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
              f.createTupleTypeNode([
                f.createTypeReferenceNode(
                  f.createQualifiedName(
                    f.createIdentifier("reactQuery"),
                    f.createIdentifier("QueryKey")
                  ),
                  undefined
                ),
                f.createFunctionTypeNode(
                  undefined,
                  verb === "get"
                    ? [
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
                          f.createTypeLiteralNode([
                            f.createPropertySignature(
                              undefined,
                              f.createIdentifier("signal"),
                              f.createToken(ts.SyntaxKind.QuestionToken),
                              f.createTypeReferenceNode(
                                f.createIdentifier("AbortSignal"),
                                undefined
                              )
                            ),
                          ]),
                          undefined
                        ),
                      ]
                    : [
                        f.createParameterDeclaration(
                          undefined,
                          undefined,
                          f.createObjectBindingPattern([
                            f.createBindingElement(
                              undefined,
                              undefined,
                              f.createIdentifier("variables"),
                              undefined
                            ),
                            f.createBindingElement(
                              undefined,
                              undefined,
                              f.createIdentifier("signal"),
                              undefined
                            ),
                          ]),
                          undefined,
                          f.createTypeLiteralNode([
                            f.createPropertySignature(
                              undefined,
                              f.createIdentifier("variables"),
                              undefined,
                              variablesType
                            ),
                            f.createPropertySignature(
                              undefined,
                              f.createIdentifier("signal"),
                              f.createToken(ts.SyntaxKind.QuestionToken),
                              f.createTypeReferenceNode(
                                f.createIdentifier("AbortSignal"),
                                undefined
                              )
                            ),
                          ]),
                          undefined
                        ),
                      ],
                  f.createTypeReferenceNode(f.createIdentifier("Promise"), [
                    dataType,
                  ])
                ),
              ]),
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createArrayLiteralExpression(
                [
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
                            f.createStringLiteral(
                              operation.operationId as string
                            )
                          ),
                          f.createShorthandPropertyAssignment(
                            f.createIdentifier("variables"),
                            undefined
                          ),
                        ],
                        true
                      ),
                    ]
                  ),
                  f.createArrowFunction(
                    [f.createModifier(ts.SyntaxKind.AsyncKeyword)],
                    undefined,
                    verb === "get"
                      ? [
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
                            f.createTypeLiteralNode([
                              f.createPropertySignature(
                                undefined,
                                f.createIdentifier("signal"),
                                f.createToken(ts.SyntaxKind.QuestionToken),
                                f.createTypeReferenceNode(
                                  f.createIdentifier("AbortSignal"),
                                  undefined
                                )
                              ),
                            ]),
                            undefined
                          ),
                        ]
                      : [
                          f.createParameterDeclaration(
                            undefined,
                            undefined,
                            f.createObjectBindingPattern([
                              f.createBindingElement(
                                undefined,
                                undefined,
                                f.createIdentifier("variables"),
                                undefined
                              ),
                              f.createBindingElement(
                                undefined,
                                undefined,
                                f.createIdentifier("signal"),
                                undefined
                              ),
                            ]),
                            undefined,
                            f.createTypeLiteralNode([
                              f.createPropertySignature(
                                undefined,
                                f.createIdentifier("variables"),
                                undefined,
                                variablesType
                              ),
                              f.createPropertySignature(
                                undefined,
                                f.createIdentifier("signal"),
                                f.createToken(ts.SyntaxKind.QuestionToken),
                                f.createTypeReferenceNode(
                                  f.createIdentifier("AbortSignal"),
                                  undefined
                                )
                              ),
                            ]),
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
                              f.createIdentifier("variables")
                            ),
                          ],
                          false
                        ),
                        f.createIdentifier("signal"),
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
