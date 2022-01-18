import { factory as f } from "typescript";

/**
 * Helper to create named imports.
 *
 * @param fnName functions to imports
 * @param filename path of the module
 * @returns ts.Node of the import declaration
 */
export const createNamedImport = (
  fnName: string | string[],
  filename: string
) => {
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
