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
     {
       "properties": {
         "age": {
           "description": undefined,
           "type": "number",
         },
         "breed": {
           "$ref": "#/components/schemas/Breed",
           "description": undefined,
         },
         "color": {
           "description": "The color of the pet",
           "type": "string",
         },
       },
       "required": [
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
     {
       "properties": {
         "age": {
           "description": undefined,
           "type": "number",
         },
         "breed": {
           "$ref": "#/components/schemas/Breed",
           "description": undefined,
         },
         "color": {
           "description": "The color of the pet",
           "type": "string",
         },
       },
       "required": [
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
     {
       "properties": {
         "iAmAMonster": {
           "description": undefined,
           "type": "string",
         },
       },
       "required": [],
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
     {
       "properties": {
         "I am a monster": {
           "description": undefined,
           "type": "string",
         },
       },
       "required": [],
       "type": "object",
     }
    `);
  });
});
