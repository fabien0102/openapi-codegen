// import { camel } from "case";
import { camelCase } from "lodash";
import { OperationObject } from "openapi3-ts";
import ts, { factory as f } from "typescript";

/**
 * Create the declaration of the fetcher function.
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
              variablesType.kind !== ts.SyntaxKind.VoidKeyword
                ? [
                    f.createParameterDeclaration(
                      undefined,
                      undefined,
                      f.createIdentifier("variables"),
                      undefined,
                      variablesType,
                      undefined
                    ),
                    
                  ]
                : [
                    f.createParameterDeclaration(
                      undefined,
                      undefined,
                      f.createIdentifier("signal"),
                      f.createToken(ts.SyntaxKind.QuestionToken),
                      f.createTypeReferenceNode(
                        f.createIdentifier("AbortSignal")
                      )
                    ),
                  ],
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              // f.createReturnStatement(
                f.createObjectLiteralExpression([
                  f.createPropertyAssignment(
                    "queryKey",
                    f.createCallExpression(
                      f.createIdentifier("queryKeyFn"),
                      undefined,
                      [
                        f.createObjectLiteralExpression([
                          f.createPropertyAssignment(
                            "path",
                            f.createStringLiteral(url)
                          ),
                          f.createPropertyAssignment(
                            "operationId",
                            f.createStringLiteral(operation.operationId as string)
                          ),
                          f.createShorthandPropertyAssignment(
                            f.createIdentifier("variables")
                          ),
                        ]),
                      ]
                    )),
                    f.createPropertyAssignment(
                    "queryFn",
                    f.createArrowFunction(
                      f.createModifiersFromModifierFlags(ts.ModifierFlags.Async),
                      undefined,
                      // [
                      //   f.createParameterDeclaration(
                      //     undefined,
                      //     undefined,
                      //     f.createIdentifier("signal"),
                      //     f.createToken(ts.SyntaxKind.QuestionToken),
                      //     f.createTypeReferenceNode(
                      //       f.createIdentifier("any")
                      //     )
                      //   ),
                      // ]
                      []
                      ,
                      undefined,
                      f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                      f.createCallExpression(
                        f.createIdentifier(operationFetcherFnName),
                        undefined,
                        [
                          f.createObjectLiteralExpression(
                            [
                              // f.createSpreadAssignment(
                              //   f.createIdentifier("fetcherOptions")
                              // ),
                              f.createSpreadAssignment(
                                f.createIdentifier("variables")
                              ),
                            ],
                            false
                          ),
                          // f.createIdentifier("signal"),
                        ]
                      )
                    )
                  )
                ])
              // ),
              // f.createCallExpression(
              //   f.createPropertyAccessExpression(
              //     f.createIdentifier("reactQuery"),
              //     f.createIdentifier("useQuery")
              //   ),
              //   [
              //     dataType,
              //     errorType,
              //     f.createTypeReferenceNode(f.createIdentifier("TData"), []),
              //   ],
              //   [
              //     ,
              //     // f.createObjectLiteralExpression(
              //     //   [
              //     //     f.createSpreadAssignment(
              //     //       f.createIdentifier("options")
              //     //     ),
              //     //     f.createSpreadAssignment(
              //     //       f.createIdentifier("queryOptions")
              //     //     ),
              //     //   ],
              //     //   true
              //     // ),
              //   ]
              // )
            )
          ),
        ],
        ts.NodeFlags.Const
      )
    )
  );
  return nodes;
};

/**
 * Transform url params case to camel.
 *
 * @example
 * `pet/{pet_id}` -> `pet/{petId}`
 */
// const camelizedPathParams = (url: string) =>
//   url.replace(/\{\w*\}/g, (match) => `{${camel(match)}}`);
