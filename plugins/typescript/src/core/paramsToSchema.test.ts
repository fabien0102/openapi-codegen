import { ParameterObject } from "openapi3-ts";
import { paramsToSchema } from "./paramsToSchema";

describe("paramsToSchema", () => {
  const params: ParameterObject[] = [
    {
      name: "breed",
      required: true,
      schema: {
        $ref: "#/components/schemas/Breed",
      },
      in: "path",
    },
    {
      name: "color",
      description: "The color of the pet",
      schema: {
        type: "string",
      },
      required: true,
      in: "path",
    },
    {
      name: "age",
      schema: {
        type: "number",
      },
      required: true,
      in: "path",
    },
  ];

  it("should convert params to an openAPI schema", () => {
    expect(paramsToSchema(params)).toMatchInlineSnapshot(`
      Object {
        "properties": Object {
          "age": Object {
            "description": undefined,
            "type": "number",
          },
          "breed": Object {
            "$ref": "#/components/schemas/Breed",
            "description": undefined,
          },
          "color": Object {
            "description": "The color of the pet",
            "type": "string",
          },
        },
        "required": Array [
          "breed",
          "color",
          "age",
        ],
        "type": "object",
      }
    `);
  });

  it("should deal with optional parameters", () => {
    expect(paramsToSchema(params, ["age"])).toMatchInlineSnapshot(`
      Object {
        "properties": Object {
          "age": Object {
            "description": undefined,
            "type": "number",
          },
          "breed": Object {
            "$ref": "#/components/schemas/Breed",
            "description": undefined,
          },
          "color": Object {
            "description": "The color of the pet",
            "type": "string",
          },
        },
        "required": Array [
          "breed",
          "color",
        ],
        "type": "object",
      }
    `);
  });

  it("should camelized every properties (pathParam)", () => {
    const schema = paramsToSchema([
      {
        in: "path",
        name: "I am a monster",
        schema: {
          type: "string",
        },
      },
    ]);

    expect(schema).toMatchInlineSnapshot(`
      Object {
        "properties": Object {
          "iAmAMonster": Object {
            "description": undefined,
            "type": "string",
          },
        },
        "required": Array [],
        "type": "object",
      }
    `);
  });

  it("should not camelized every properties (queryParams)", () => {
    const schema = paramsToSchema([
      {
        in: "query",
        name: "I am a monster",
        schema: {
          type: "string",
        },
      },
    ]);

    expect(schema).toMatchInlineSnapshot(`
      Object {
        "properties": Object {
          "I am a monster": Object {
            "description": undefined,
            "type": "string",
          },
        },
        "required": Array [],
        "type": "object",
      }
    `);
  });
});
