import { describe, expect, it } from "vitest";
import { OpenAPIObject } from "openapi3-ts/oas30";
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
     {
       "info": {
         "title": "petshop",
         "version": "1.0.0",
       },
       "openapi": "3.0.0",
       "paths": {
         "/pets": {
           "get": {
             "description": "Get all the pets",
             "operationId": "listPets",
             "responses": {
               "200": {
                 "content": {
                   "application/json": {
                     "schema": {
                       "items": {
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
           "parameters": [
             {
               "in": "path",
               "name": "breed",
               "required": false,
               "schema": {
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
     {
       "info": {
         "title": "petshop",
         "version": "1.0.0",
       },
       "openapi": "3.0.0",
       "paths": {
         "/pets": {
           "get": {
             "description": "Get all the pets",
             "operationId": "listPets",
             "responses": {
               "200": {
                 "content": {
                   "application/json": {
                     "schema": {
                       "items": {
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
           "parameters": [
             {
               "in": "path",
               "name": "breed",
               "required": true,
               "schema": {
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
     {
       "info": {
         "title": "petshop",
         "version": "1.0.0",
       },
       "openapi": "3.0.0",
       "paths": {
         "/pets": {
           "get": {
             "description": "Get all the pets",
             "operationId": "listPets",
             "responses": {
               "200": {
                 "content": {
                   "application/json": {
                     "schema": {
                       "items": {
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
