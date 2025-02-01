import ts from "typescript";

import type { Config, Import, Plugin } from "../types";

const { factory } = ts;

export type GenerateConfigOptions = {
  /**
   * New configuration key
   */
  namespace: string;

  /**
   * Configuration options
   */
  options: Pick<Config, "from" | "outputDir"> & { plugin: Plugin };
};

/**
 * Generate the configuration `PropertyAssignment` node.
 */
export function generateConfigProperty({
  namespace,
  options,
}: GenerateConfigOptions) {
  return factory.createPropertyAssignment(
    factory.createIdentifier(namespace),
    factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment(
          factory.createIdentifier("from"),
          factory.createObjectLiteralExpression(
            Object.entries(options.from).map(
              ([key, value]) =>
                factory.createPropertyAssignment(
                  factory.createIdentifier(key),
                  typeof value === "string"
                    ? factory.createStringLiteral(value)
                    : factory.createObjectLiteralExpression(
                        Object.entries(value).map(([k, v]) =>
                          factory.createPropertyAssignment(
                            factory.createIdentifier(k),
                            factory.createStringLiteral(v),
                          ),
                        ),
                      ),
                ),
              true,
            ),
            true,
          ),
        ),
        factory.createPropertyAssignment(
          factory.createIdentifier("outputDir"),
          factory.createStringLiteral(options.outputDir),
        ),
        factory.createPropertyAssignment(
          factory.createIdentifier("to"),
          factory.createArrowFunction(
            [factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                factory.createIdentifier("context"),
                undefined,
                undefined,
                undefined,
              ),
            ],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createBlock(
              getToFunctionStatements(options.plugin, namespace),
              true,
            ),
          ),
        ),
      ],
      true,
    ),
  );
}

function getToFunctionStatements(
  plugin: Plugin,
  namespace: string,
): ts.Statement[] {
  switch (plugin) {
    case "typescript/types-only":
      return [
        factory.createExpressionStatement(
          factory.createAwaitExpression(
            factory.createCallExpression(
              factory.createIdentifier("generateSchemaTypes"),
              undefined,
              [
                factory.createIdentifier("context"),
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      factory.createIdentifier("filenamePrefix"),
                      factory.createStringLiteral(namespace),
                    ),
                  ],
                  true,
                ),
              ],
            ),
          ),
        ),
      ];
    case "typescript/fetch":
      return [
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                factory.createIdentifier("filenamePrefix"),
                undefined,
                undefined,
                factory.createStringLiteral(namespace),
              ),
            ],
            ts.NodeFlags.Const |
              ts.NodeFlags.AwaitContext |
              ts.NodeFlags.ContextFlags |
              ts.NodeFlags.TypeExcludesFlags,
          ),
        ),
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                factory.createObjectBindingPattern([
                  factory.createBindingElement(
                    undefined,
                    undefined,
                    factory.createIdentifier("schemasFiles"),
                    undefined,
                  ),
                ]),
                undefined,
                undefined,
                factory.createAwaitExpression(
                  factory.createCallExpression(
                    factory.createIdentifier("generateSchemaTypes"),
                    undefined,
                    [
                      factory.createIdentifier("context"),
                      factory.createObjectLiteralExpression(
                        [
                          factory.createShorthandPropertyAssignment(
                            factory.createIdentifier("filenamePrefix"),
                            undefined,
                          ),
                        ],
                        true,
                      ),
                    ],
                  ),
                ),
              ),
            ],
            ts.NodeFlags.Const |
              ts.NodeFlags.AwaitContext |
              ts.NodeFlags.ContextFlags |
              ts.NodeFlags.TypeExcludesFlags,
          ),
        ),
        factory.createExpressionStatement(
          factory.createAwaitExpression(
            factory.createCallExpression(
              factory.createIdentifier("generateFetchers"),
              undefined,
              [
                factory.createIdentifier("context"),
                factory.createObjectLiteralExpression(
                  [
                    factory.createShorthandPropertyAssignment(
                      factory.createIdentifier("filenamePrefix"),
                      undefined,
                    ),
                    factory.createShorthandPropertyAssignment(
                      factory.createIdentifier("schemasFiles"),
                      undefined,
                    ),
                  ],
                  true,
                ),
              ],
            ),
          ),
        ),
      ];
    case "typescript/react-query":
      return [
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                factory.createIdentifier("filenamePrefix"),
                undefined,
                undefined,
                factory.createStringLiteral(namespace),
              ),
            ],
            ts.NodeFlags.Const |
              ts.NodeFlags.AwaitContext |
              ts.NodeFlags.ContextFlags |
              ts.NodeFlags.TypeExcludesFlags,
          ),
        ),
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                factory.createObjectBindingPattern([
                  factory.createBindingElement(
                    undefined,
                    undefined,
                    factory.createIdentifier("schemasFiles"),
                    undefined,
                  ),
                ]),
                undefined,
                undefined,
                factory.createAwaitExpression(
                  factory.createCallExpression(
                    factory.createIdentifier("generateSchemaTypes"),
                    undefined,
                    [
                      factory.createIdentifier("context"),
                      factory.createObjectLiteralExpression(
                        [
                          factory.createShorthandPropertyAssignment(
                            factory.createIdentifier("filenamePrefix"),
                            undefined,
                          ),
                        ],
                        true,
                      ),
                    ],
                  ),
                ),
              ),
            ],
            ts.NodeFlags.Const |
              ts.NodeFlags.AwaitContext |
              ts.NodeFlags.ContextFlags |
              ts.NodeFlags.TypeExcludesFlags,
          ),
        ),
        factory.createExpressionStatement(
          factory.createAwaitExpression(
            factory.createCallExpression(
              factory.createIdentifier("generateReactQueryComponents"),
              undefined,
              [
                factory.createIdentifier("context"),
                factory.createObjectLiteralExpression(
                  [
                    factory.createShorthandPropertyAssignment(
                      factory.createIdentifier("filenamePrefix"),
                      undefined,
                    ),
                    factory.createShorthandPropertyAssignment(
                      factory.createIdentifier("schemasFiles"),
                      undefined,
                    ),
                  ],
                  true,
                ),
              ],
            ),
          ),
        ),
      ];
  }
}

/**
 * Get list of required imports regarding the plugin
 *
 * @param plugin
 * @returns
 */
export function getImports(plugin: Plugin): Import[] {
  switch (plugin) {
    case "typescript/fetch":
      return [
        {
          module: "@openapi-codegen/typescript",
          namedImports: ["generateSchemaTypes", "generateFetchers"],
        },
      ];
    case "typescript/types-only":
      return [
        {
          module: "@openapi-codegen/typescript",
          namedImports: ["generateSchemaTypes"],
        },
      ];
    case "typescript/react-query":
      return [
        {
          module: "@openapi-codegen/typescript",
          namedImports: ["generateSchemaTypes", "generateReactQueryComponents"],
        },
      ];
  }
}
