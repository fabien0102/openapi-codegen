import ts, { factory as f } from "typescript";

import { print } from "../testUtils";
import { collectErrors } from "./collectErrors";

describe("collectErrors", () => {
  it("should extract all errors (without duplication)", () => {
    const allErrors = new Map<string, ts.Node>();
    const printNodes = (nodes: ts.Node[]) => nodes.map(print).join("\n");

    collectErrors({
      allErrors,
      printNodes,
      errorType: createErrorNode(
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Responses"),
            f.createIdentifier("Error")
          ),
          undefined
        )
      ),
    });

    collectErrors({
      allErrors,
      printNodes,
      errorType: createErrorNode(
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Responses"),
            f.createIdentifier("NotFound")
          ),
          undefined
        )
      ),
    });

    // Duplicate
    collectErrors({
      allErrors,
      printNodes,
      errorType: createErrorNode(
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Responses"),
            f.createIdentifier("NotFound")
          ),
          undefined
        )
      ),
    });

    expect(printNodes([...allErrors.values()])).toMatchInlineSnapshot(`
      "Responses.Error
      Responses.NotFound"
    `);
  });

  it("should deal with unions", () => {
    const allErrors = new Map<string, ts.Node>();
    const printNodes = (nodes: ts.Node[]) => nodes.map(print).join("\n");

    collectErrors({
      allErrors,
      printNodes,
      errorType: createErrorNode(
        f.createUnionTypeNode([
          f.createTypeReferenceNode(
            f.createQualifiedName(
              f.createIdentifier("Responses"),
              f.createIdentifier("Error")
            ),
            undefined
          ),
          f.createTypeReferenceNode(
            f.createQualifiedName(
              f.createIdentifier("Responses"),
              f.createIdentifier("NotFound")
            ),
            undefined
          ),
        ])
      ),
    });

    collectErrors({
      allErrors,
      printNodes,
      errorType: createErrorNode(
        f.createTypeReferenceNode(
          f.createQualifiedName(
            f.createIdentifier("Responses"),
            f.createIdentifier("NotFound")
          ),
          undefined
        )
      ),
    });

    expect(printNodes([...allErrors.values()])).toMatchInlineSnapshot(`
      "Responses.Error
      Responses.NotFound"
    `);
  });
});

const createErrorNode = (payload: ts.TypeNode) => {
  return f.createTypeReferenceNode(
    f.createQualifiedName(
      f.createIdentifier("Fetcher"),
      f.createIdentifier("ErrorWrapper")
    ),
    [
      f.createTypeLiteralNode([
        f.createPropertySignature(
          undefined,
          f.createIdentifier("status"),
          undefined,
          f.createLiteralTypeNode(f.createNumericLiteral("500"))
        ),
        f.createPropertySignature(
          undefined,
          f.createIdentifier("payload"),
          undefined,
          payload
        ),
      ]),
    ]
  );
};
