import { print } from "../testUtils";
import ts, { factory as f } from "typescript";
import { getVariablesType } from "./getVariablesType";

describe("getVariableType", () => {
  it("should return void if no types are provided", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: undefinedType,
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`"void"`);
  });

  it("should have requestBody type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: undefinedType,
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          body: string;
      }"
    `);
  });

  it("should have headers type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: createType("Headers", "Foo"),
      pathParamsType: undefinedType,
      queryParamsType: undefinedType,
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          headers: Headers.Foo;
      }"
    `);
  });

  it("should have pathParams type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
      queryParamsType: undefinedType,
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          pathParams: number;
      }"
    `);
  });

  it("should have queryParams type declared", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: createType("QueryParams", "Foo"),
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`
      "{
          queryParams: QueryParams.Foo;
      }"
    `);
  });

  it("should ignore empty type", () => {
    const variablesType = getVariablesType({
      requestBodyType: undefinedType,
      headersType: undefinedType,
      pathParamsType: undefinedType,
      queryParamsType: f.createTypeLiteralNode([]), // = {}
      headersOptional: false,
      pathParamsOptional: false,
      queryParamsOptional: false,
      requestBodyOptional: false,
    });

    expect(print(variablesType)).toMatchInlineSnapshot(`"void"`);
  });

  it("should combine types", () => {
    const variablesType = getVariablesType({
      requestBodyType: createType("RequestBody", "Pet"),
      headersType: createType("Headers", "Pet"),
      pathParamsType: createType("PathParams", "Pet"),
      queryParamsType: createType("QueryParams", "Pet"),
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
      }"
    `);
  });

  it("should mark types as optional", () => {
    const variablesType = getVariablesType({
      requestBodyType: createType("RequestBody", "Pet"),
      headersType: createType("Headers", "Pet"),
      pathParamsType: createType("PathParams", "Pet"),
      queryParamsType: createType("QueryParams", "Pet"),
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
      }"
    `);
  });
});

// Helpers
const createType = (namespace: string, name: string) =>
  f.createTypeReferenceNode(
    f.createQualifiedName(
      f.createIdentifier(namespace),
      f.createIdentifier(name)
    )
  );

const undefinedType = f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
