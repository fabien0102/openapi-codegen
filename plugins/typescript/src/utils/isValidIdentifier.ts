/**
 * Avoids depending on tsutils, which resolves `typescript` at runtime via a
 * peer dependency and can pick up an incompatible version (e.g. TypeScript 7).
 */
export const isValidIdentifier = (text: string): boolean =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text) && !reservedWords.has(text);

const reservedWords = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
]);
