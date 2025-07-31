import { factory as f } from "typescript";
import type * as ts from "typescript";
import { analyzeImportUsage } from "./analyzeImportUsage";

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

/**
 * Helper to determine whether an import should be type-only based on actual usage.
 *
 * @param importName the name of the import
 * @param useTypeImports whether to use type-only imports
 * @param nodes AST nodes to analyze for usage
 * @returns true if the import should be type-only
 */
export const shouldUseTypeImport = (
  importName: string,
  useTypeImports: boolean,
  nodes?: ts.Node[]
): boolean => {
  if (!useTypeImports) {
    return false;
  }

  if (nodes) {
    const isTypeOnly = analyzeImportUsage(nodes, importName);
    return isTypeOnly;
  }

  return false;
};

/**
 * Helper to create named imports with types.
 *
 * @param typeImports array of import names that should be type-only
 * @param valueImports array of import names that should be value imports
 * @param filename path of the module
 * @returns ts.Node of the merged import declaration
 */
export const createNamedImportWithTypes = (
  typeImports: string[],
  valueImports: string[],
  filename: string
) => {
  const allImports = [
    ...typeImports.map((name) =>
      f.createImportSpecifier(true, undefined, f.createIdentifier(name))
    ),
    ...valueImports.map((name) =>
      f.createImportSpecifier(false, undefined, f.createIdentifier(name))
    ),
  ];

  return f.createImportDeclaration(
    undefined,
    f.createImportClause(false, undefined, f.createNamedImports(allImports)),
    f.createStringLiteral(filename),
    undefined
  );
};
