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
 * GraphQL Code Generator inspired import generation.
 * This function determines whether an import should be type-only based on actual usage.
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

  // If we have AST nodes, use GraphQL Code Generator style analysis
  if (nodes) {
    const isTypeOnly = analyzeImportUsage(nodes, importName);
    return isTypeOnly;
  }
  
  // If no AST nodes available, default to false (conservative approach)
  // This matches GraphQL Code Generator's behavior - no pattern matching fallback
  return false;
};
