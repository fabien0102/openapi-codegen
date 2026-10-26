import ts from "typescript";

export function isValidIdentifier(name: string): boolean {
  if (!name || name.length === 0) {
    return false;
  }

  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    name
  );

  const token = scanner.scan();
  if (
    token !== ts.SyntaxKind.Identifier &&
    !(
      typeof (scanner as unknown as Record<string, () => boolean>)
        .isIdentifier === "function" &&
      (scanner as unknown as Record<string, () => boolean>).isIdentifier() &&
      !(scanner as unknown as Record<string, () => boolean>).isReservedWord()
    )
  ) {
    return false;
  }

  const end = scanner.getTokenPos() + scanner.getTokenText().length;
  return end === name.length;
}
