import ts from "typescript";

export function getText(expression: ts.Expression) {
  try {
    // @ts-expect-error
    return (expression.text as string) ?? "";
  } catch {
    return "";
  }
}
