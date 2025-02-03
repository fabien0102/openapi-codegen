import { factory as f } from "typescript";

/**
 * Helper to create namespace import.
 *
 * @param namespace namespace import identifier
 * @param filename path of the module
 * @returns ts.Node of the import declaration
 */
export const createNamespaceImport = (namespace: string, filename: string) =>
  f.createImportDeclaration(
    undefined,
    f.createImportClause(
      true,
      undefined,
      f.createNamespaceImport(f.createIdentifier(namespace))
    ),
    f.createStringLiteral(filename),
    undefined
  );
