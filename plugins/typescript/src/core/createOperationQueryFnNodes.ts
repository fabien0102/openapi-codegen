import { camelCase } from "lodash";
import { OperationObject } from "openapi3-ts";
import ts, { factory as f } from "typescript";

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
              f.createTupleTypeNode([
                f.createTypeReferenceNode(f.createIdentifier("reactQuery.QueryKey")),
                f.createTypeReferenceNode(
                  f.createIdentifier(
                    "({ signal }: { signal?: AbortSignal; }) => Promise"
                  ),
                  [dataType]
                ),
              ]),

              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              f.createArrayLiteralExpression([
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
                ),
                f.createArrowFunction(
                  f.createModifiersFromModifierFlags(ts.ModifierFlags.Async),
                  undefined,
                  [
                    f.createParameterDeclaration(
                      undefined,
                      undefined,
                      f.createIdentifier("{signal}"),
                      undefined,
                      f.createTypeReferenceNode(
                        f.createIdentifier("{signal?:any}")
                      )
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
