import { OpenAPIObject } from "openapi3-ts";
import { addPathParam } from "./addPathParam";

describe("addPathParam", () => {
  const openAPIDocument: OpenAPIObject = {
    openapi: "3.0.0",
    info: {
      title: "petshop",
      version: "1.0.0",
    },
    paths: {
      "/pets": {
        get: {
          operationId: "listPets",
          description: "Get all the pets",
          responses: {
            "200": {
              description: "pet response",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Pet",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  it("should add a new path param not required", async () => {
    const openAPIDocumentWithPathParam = addPathParam({
      openAPIDocument,
      pathParam: "breed",
      required: false,
    });

    expect(openAPIDocumentWithPathParam).toMatchInlineSnapshot(`
      Object {
        "info": Object {
          "title": "petshop",
          "version": "1.0.0",
        },
        "openapi": "3.0.0",
        "paths": Object {
          "/pets": Object {
            "get": Object {
              "description": "Get all the pets",
              "operationId": "listPets",
              "responses": Object {
                "200": Object {
                  "content": Object {
                    "application/json": Object {
                      "schema": Object {
                        "items": Object {
                          "$ref": "#/components/schemas/Pet",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "pet response",
                },
              },
            },
            "parameters": Array [
              Object {
                "in": "path",
                "name": "breed",
                "required": false,
                "schema": Object {
                  "type": "string",
                },
              },
            ],
          },
        },
      }
    `);
  });

  it("should add a new path param required", async () => {
    const openAPIDocumentWithPathParam = addPathParam({
      openAPIDocument,
      pathParam: "breed",
      required: true,
    });

    expect(openAPIDocumentWithPathParam).toMatchInlineSnapshot(`
      Object {
        "info": Object {
          "title": "petshop",
          "version": "1.0.0",
        },
        "openapi": "3.0.0",
        "paths": Object {
          "/pets": Object {
            "get": Object {
              "description": "Get all the pets",
              "operationId": "listPets",
              "responses": Object {
                "200": Object {
                  "content": Object {
                    "application/json": Object {
                      "schema": Object {
                        "items": Object {
                          "$ref": "#/components/schemas/Pet",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "pet response",
                },
              },
            },
            "parameters": Array [
              Object {
                "in": "path",
                "name": "breed",
                "required": true,
                "schema": Object {
                  "type": "string",
                },
              },
            ],
          },
        },
      }
    `);
  });

  it("should add a new path param conditionally", async () => {
    const openAPIDocumentWithPathParam = addPathParam({
      openAPIDocument,
      pathParam: "breed",
      required: false,
      condition: (key) => key !== "/pets",
    });

    expect(openAPIDocumentWithPathParam).toMatchInlineSnapshot(`
      Object {
        "info": Object {
          "title": "petshop",
          "version": "1.0.0",
        },
        "openapi": "3.0.0",
        "paths": Object {
          "/pets": Object {
            "get": Object {
              "description": "Get all the pets",
              "operationId": "listPets",
              "responses": Object {
                "200": Object {
                  "content": Object {
                    "application/json": Object {
                      "schema": Object {
                        "items": Object {
                          "$ref": "#/components/schemas/Pet",
                        },
                        "type": "array",
                      },
                    },
                  },
                  "description": "pet response",
                },
              },
            },
          },
        },
      }
    `);
  });
});
