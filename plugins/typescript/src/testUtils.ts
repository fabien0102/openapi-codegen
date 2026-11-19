import ts from "typescript";

const sourceFile = ts.createSourceFile("index.ts", "", ts.ScriptTarget.Latest);

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
});

/**
 * Print a typescript node
 */
export const print = (node: ts.Node) =>
  printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);

/**
 * Create a mock (like `vi.fn()`) with embedded prettier step.
 */
export const createWriteFileMock = () => {
  const calls: [string, string][] = [];
  async function fn(file: string, data: string) {
    const oxfmt = await import("oxfmt");
    const formattedFile = await oxfmt.format(file, data, {
      trailingComma: "es5",
    });
    calls.push([file, formattedFile.code]);
  }

  fn.mock = { calls };

  return fn;
};
