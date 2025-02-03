import ts from "typescript";

export function getText(expression: ts.Expression) {
  try {
    // @ts-expect-error this is a private field
    return (expression.text as string) ?? "";
  } catch {
    return "";
  }
}
