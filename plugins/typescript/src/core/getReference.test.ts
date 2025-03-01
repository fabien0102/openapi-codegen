import { ComponentsObject } from "openapi3-ts/oas30";
import { describe, expect, it } from "vitest";
import { getReferenceSchema } from "./getReference";

describe("getReferenceSchema", () => {
  const components = {
    schemas: {
      foo: {
        type: "string",
      },
      bar: {
        type: "number",
      },
      baz: {
        $ref: "#/components/schemas/bar",
      },
      "with.dot": {
        type: "string",
      },
    },
  } satisfies ComponentsObject;

  it("should resolve a reference", () => {
    const schema = getReferenceSchema("#/components/schemas/foo", components);
    expect(schema).toEqual(components.schemas.foo);
  });

  it("should throw if the reference can't be found", () => {
    expect(() =>
      getReferenceSchema("#/components/schemas/notfound", components)
    ).toThrowError("#/components/schemas/notfound not found!");
  });

  it("should resolve ref redirection", () => {
    const schema = getReferenceSchema("#/components/schemas/baz", components);
    expect(schema).toEqual(components.schemas.bar);
  });

  it("should resolve ref with dots", () => {
    const schema = getReferenceSchema(
      "#/components/schemas/with.dot",
      components
    );
    expect(schema).toEqual(components.schemas["with.dot"]);
  });
});
