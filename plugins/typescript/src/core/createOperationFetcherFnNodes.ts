import { camel } from "case";
import { OperationObject } from "openapi3-ts";
import ts, { factory as f } from "typescript";

/**
 * Create the declaration of the fetcher function.
 *
 * @returns Array of nodes
 */
export const createOperationFetcherFnNodes = ({
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

/**
 * Transform url params case to camel.
 *
 * @example
 * `pet/{pet_id}` -> `pet/{petId}`
 */
const camelizedPathParams = (url: string) =>
  url.replace(/\{\w*\}/g, (match) => `{${camel(match)}}`);
