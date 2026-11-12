import ts from "typescript";

/**
 * Determines whether the given text parses as a standalone identifier.
 * This is not a guarantee that it works in every context. The property name in PropertyAccessExpressions for example allows reserved words.
 * Depending on the context it could be parsed as contextual keyword or TypeScript keyword.
 *
 * @see https://github.com/ajafff/tsutils/blob/03b4df15d14702f9c7a128ac3fae77171778d613/util/util.ts#L642
 */
export const isValidIdentifier = (text: string) => {
  const scanner = ts.createScanner(
    ts.ScriptTarget.ESNext,
    false,
    undefined,
    text
  );
  scanner.scan();
  return (
    scanner.isIdentifier() &&
    scanner.getTokenStart() === 0 &&
    scanner.getTokenEnd() === text.length
  );
};
