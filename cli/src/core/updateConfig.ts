import ts from "typescript";
import type { Import } from "../types";

const { factory: f } = ts;

interface AddImportsOptions {
  /**
   * Original sourceFile
   */
  sourceFile: ts.SourceFile;

  /**
   * List of imports to insert in the file
   */
  importsToInsert: Import[];

  /**
   * List of the existing imports (module name)
   */
  existingImports: string[];

  /**
   * Config property to add
   */
  configProperty: ts.PropertyAssignment;
}

export function updateConfig({
  sourceFile,
  existingImports,
  importsToInsert,
  configProperty,
}: AddImportsOptions) {
  // Split imports in two categories
  const { toInsert, toUpdate } = importsToInsert.reduce(
    (mem, i) => {
      if (existingImports.includes(i.module)) {
        mem.toUpdate.set(i.module, i.namedImports);
      } else {
        mem.toInsert.set(i.module, i.namedImports);
      }
      return mem;
    },
    {
      toInsert: new Map<string, string[]>(),
      toUpdate: new Map<string, string[]>(),
    }
  );

  const addImportsAndConfigProperty: ts.TransformerFactory<ts.SourceFile> = (
    context
  ) => {
    const visit: ts.Visitor = (node) => {
      node = ts.visitEachChild(node, visit, context);

      if (
        ts.isImportDeclaration(node) &&
        toUpdate.has(getText(node.moduleSpecifier))
      ) {
        const importClauseNames: string[] = toUpdate.get(
          getText(node.moduleSpecifier)
        )!;
        node.importClause?.namedBindings?.forEachChild((child) => {
          if (
            ts.isImportSpecifier(child) &&
            !importClauseNames.includes(child.name.text)
          ) {
            importClauseNames.unshift(child.name.text);
          }
        });

        return f.createImportDeclaration(
          node.modifiers,
          f.createImportClause(
            false,
            undefined,
            f.createNamedImports(
              importClauseNames.map((i) =>
                f.createImportSpecifier(false, undefined, f.createIdentifier(i))
              )
            )
          ),
          node.moduleSpecifier
        );
      }

      if (
        ts.isExportAssignment(node) &&
        ts.isCallExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.escapedText === "defineConfig"
      ) {
        const prevProperties = ts.isObjectLiteralExpression(
          node.expression.arguments[0]
        )
          ? node.expression.arguments[0].properties
          : [];

        return f.updateExportAssignment(
          node,
          node.decorators,
          node.modifiers,
          f.updateCallExpression(
            node.expression,
            node.expression.expression,
            node.expression.typeArguments,
            [
              f.createObjectLiteralExpression(
                [...prevProperties, configProperty],
                true
              ),
            ]
          )
        );
      }

      return node;
    };

    return (node) => ts.visitNode(node, visit);
  };

  const {
    transformed: [sourceFileWithImports],
  } = ts.transform(sourceFile, [addImportsAndConfigProperty]);

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  return ts.createSourceFile(
    "index.ts",
    createImportStatements(toInsert) + printer.printFile(sourceFileWithImports),
    ts.ScriptTarget.ESNext
  );
}

function createImportStatements(imports: Map<string, string[]>) {
  if (imports.size === 0) return "";

  const sourceFile = ts.createSourceFile(
    "index.ts",
    "",
    ts.ScriptTarget.ESNext
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  const statements = Array.from(imports.entries()).map(
    ([module, namedImports]) =>
      f.createImportDeclaration(
        undefined,
        f.createImportClause(
          false,
          undefined,
          f.createNamedImports(
            namedImports.map((name) =>
              f.createImportSpecifier(
                false,
                undefined,
                f.createIdentifier(name)
              )
            )
          )
        ),
        f.createStringLiteral(module),
        undefined
      )
  );

  return statements
    .map((statement) =>
      printer.printNode(ts.EmitHint.Unspecified, statement, sourceFile)
    )
    .join("\n");
}

function getText(expression: ts.Expression) {
  try {
    // @ts-expect-error
    return (expression.text as string) ?? "";
  } catch {
    return "";
  }
}
