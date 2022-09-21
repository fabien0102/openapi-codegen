import { factory as f } from "typescript";

/**
 * Helper to create named imports.
 *
 * @param fnName functions to imports
 * @param filename path of the module
 * @param isTypeOnly whether fnName are used as types only
 * @returns ts.Node of the import declaration
 */
export const createNamedImport = (
  fnName: string | string[],
  filename: string,
  isTypeOnly = false
) => {
  const fnNames = Array.isArray(fnName) ? fnName : [fnName];
  return f.createImportDeclaration(
    undefined,
    f.createImportClause(
      isTypeOnly,
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
