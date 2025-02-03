import ts from "typescript";
import prettier from "prettier";

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
    calls.push([
      file,
      await prettier.format(data, {
        parser: "babel-ts",
      }),
    ]);
  }

  fn.mock = { calls };

  return fn;
};
