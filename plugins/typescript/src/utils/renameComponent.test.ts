import { describe, expect, it } from "vitest";
import { OpenAPIObject } from "openapi3-ts/oas30";
import { petstore } from "../fixtures/petstore";
import { renameComponent } from "./renameComponent";

describe("renameComponent", () => {
  it("should rename all $ref", () => {
    const updatedSpecs = renameComponent({
      openAPIDocument: petstore,
      from: "#/components/schemas/Pet",
      to: "#/components/schemas/APet",
    });
    const updatedSpecsAsString = JSON.stringify(updatedSpecs);

    expect(updatedSpecsAsString.includes("#/components/schemas/Pet")).toBe(
      false
    );
    expect(updatedSpecsAsString.includes("#/components/schemas/APet")).toBe(
      true
    );
  });

  it("should rename the schema object", () => {
    const updatedSpecs = renameComponent({
      openAPIDocument: petstore,
      from: "#/components/schemas/Pet",
      to: "#/components/schemas/APet",
    });

    expect(updatedSpecs.components?.schemas?.Pet).toEqual(undefined);
    expect(updatedSpecs.components?.schemas?.APet).toEqual(
      petstore.components?.schemas?.Pet
    );
  });

  it("should not rename non-related $ref", () => {
    const openAPIDocument: OpenAPIObject = {
      openapi: "3.0.0",
      info: {
        title: "Test",
        version: "1.0.0",
      },
      paths: {},
      components: {
        schemas: {
          Foo: {
            description: "Should be rename in Baz",
            type: "string",
          },
          FooFoo: {
            type: "number",
          },
          Bar: {
            type: "object",
            properties: {
              foo: {
                description: "Should be rename in Baz",
                $ref: "#/components/schemas/Foo",
              },
              fooFoo: {
                $ref: "#/components/schemas/FooFoo",
              },
            },
          },
        },
      },
    };

    expect(
      renameComponent({
        openAPIDocument,
        from: "#/components/schemas/Foo",
        to: "#/components/schemas/Baz",
      })
    ).toMatchInlineSnapshot(`
     {
       "components": {
         "schemas": {
           "Bar": {
             "properties": {
               "foo": {
                 "$ref": "#/components/schemas/Baz",
                 "description": "Should be rename in Baz",
               },
               "fooFoo": {
                 "$ref": "#/components/schemas/FooFoo",
               },
             },
             "type": "object",
           },
           "Baz": {
             "description": "Should be rename in Baz",
             "type": "string",
           },
           "FooFoo": {
             "type": "number",
           },
         },
       },
       "info": {
         "title": "Test",
         "version": "1.0.0",
       },
       "openapi": "3.0.0",
       "paths": {},
     }
    `);
  });
});
