import ts, { factory as f } from "typescript";
import { getVariablesType } from "./getVariablesType";

describe("getVariableType", () => {
  it("should return the fetcherOption type if no types are provided", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: undefinedType,
      contextTypeName: "MyContext",
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(
      `"MyContext[\\"fetcherOptions\\"]"`
    );
  });

  it("should have requestBody type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: undefinedType,
      contextTypeName: "MyContext",
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          body: string;
      } & MyContext[\\"fetcherOptions\\"]"
    `);
  });

  it("should have headers type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: createType("Headers", "Foo"),
      pathParamsType: undefinedType,
      queryParamsType: undefinedType,
      contextTypeName: "MyContext",
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          headers: Headers.Foo;
      } & MyContext[\\"fetcherOptions\\"]"
    `);
  });

  it("should have pathParams type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
      queryParamsType: undefinedType,
      contextTypeName: "MyContext",
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          pathParams: number;
      } & MyContext[\\"fetcherOptions\\"]"
    `);
  });

  it("should have queryParams type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: createType("QueryParams", "Foo"),
      contextTypeName: "MyContext",
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          queryParams: QueryParams.Foo;
      } & MyContext[\\"fetcherOptions\\"]"
    `);
  });

  it("should ignore empty type", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: f.createTypeLiteralNode([]), // = {}
      contextTypeName: "MyContext",
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(
      `"MyContext[\\"fetcherOptions\\"]"`
    );
  });

  it("should combine types", () => {
    const variablesType = getVariablesType({
      requestBodyType: createType("RequestBody", "Pet"),
      headersType: createType("Headers", "Pet"),
      pathParamsType: createType("PathParams", "Pet"),
      queryParamsType: createType("QueryParams", "Pet"),
      contextTypeName: "MyContext",
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          body: RequestBody.Pet;
          headers: Headers.Pet;
          pathParams: PathParams.Pet;
          queryParams: QueryParams.Pet;
      } & MyContext[\\"fetcherOptions\\"]"
    `);
  });

  it("should mark types as optional", () => {
    const variablesType = getVariablesType({
      requestBodyType: createType("RequestBody", "Pet"),
      headersType: createType("Headers", "Pet"),
      pathParamsType: createType("PathParams", "Pet"),
      queryParamsType: createType("QueryParams", "Pet"),
      contextTypeName: "MyContext",
      headersOptional: true,
      pathParamsOptional: true,
      queryParamsOptional: true,
      requestBodyOptional: true,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          body?: RequestBody.Pet;
          headers?: Headers.Pet;
          pathParams?: PathParams.Pet;
          queryParams?: QueryParams.Pet;
      } & MyContext[\\"fetcherOptions\\"]"
    `);
  });
});

// Helpers
const sourceFile = ts.createSourceFile("index.ts", "", ts.ScriptTarget.Latest);

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
});

const print = (node: ts.Node) =>
  printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);

const createType = (namespace: string, name: string) =>
  f.createTypeReferenceNode(
    f.createQualifiedName(
      f.createIdentifier(namespace),
      f.createIdentifier(name)
    )
  );

const undefinedType = f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
