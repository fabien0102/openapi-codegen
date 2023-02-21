import { getReferenceSchema } from "./getReferenceSchema";

import type { OpenAPIObject, SchemasObject } from "openapi3-ts";

type OpenAPIDocWithComponents = Pick<OpenAPIObject, "components">;

const schemas: SchemasObject =  {
  "Pet": {
    "type": "object",
    "description": "Pet",
    "required": [
      "id",
      "name"
    ],
    "properties": {
      "id": {
        "type": "integer",
        "format": "int64"
      },
      "name": {
        "type": "string"
      },
      "tag": {
        "type": "string"
      }
    }
  },
  "Pet.With.Dot": {
    "type": "object",
    "description": "Pet.With.Dot",
    "required": [
      "id",
      "name"
    ],
    "properties": {
      "id": {
        "type": "integer",
        "format": "int64"
      },
      "name": {
        "type": "string"
      },
      "tag": {
        "type": "string"
      }
    }
  },
  "PetRef": {
    $ref: "#/components/schemas/Pet"
  },
};

const document: OpenAPIDocWithComponents = {
  components: {
    schemas
  }
};

const base$Ref = "#/components/schemas";

describe('getReferenceSchema', () => {
  it('should return the SchemaObject from $ref with a nested leaf path', () => {
    const $ref = `${base$Ref}/Pet`;
    const schema = getReferenceSchema($ref, document);
    expect(schema).toBeDefined();
    expect(schema.description).toBe(schemas.Pet.description);
  });

  it('should return the SchemaObject from $ref with a dot-separated leaf path', () => {
    const $ref = `${base$Ref}/Pet.With.Dot`;
    const schema = getReferenceSchema($ref, document);
    expect(schema).toBeDefined();
    expect(schema.description).toBe(schemas['Pet.With.Dot'].description);
  });

  it('should throw an Error if the $ref cannot be found', () => {
    const $ref = `${base$Ref}/does/not/exist`;
    expect(() => getReferenceSchema($ref, document)).toThrowError(new RegExp($ref, 'g'));
  });

  it("should resolve the schema if the $ref has a nested $ref", () => {
    const $ref = `${base$Ref}/PetRef`;
    const schema = getReferenceSchema($ref, document);
    expect(schema).toBeDefined();
    expect(schema.description).toBe(schemas.Pet.description);
  });

  it("should throw an error if he resulting schema is not a valid SchemaObject", () => {
    // TODO: not sure how to produce this scenario
  });
});