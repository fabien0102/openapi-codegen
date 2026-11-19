import ts from "typescript";

export function getText(expression: ts.Expression) {
  try {
    return (
      ((expression as unknown as Record<string, unknown>).text as string) ?? ""
    );
  } catch {
    return "";
  }
}
