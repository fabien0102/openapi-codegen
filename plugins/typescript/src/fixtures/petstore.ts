import { OpenAPIObject } from "openapi3-ts/oas30";

export const petstore: OpenAPIObject = {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Swagger Petstore",
    description:
      "A sample API that uses a petstore as an example to demonstrate features in the OpenAPI 3.0 specification",
    termsOfService: "http://swagger.io/terms/",
    contact: {
      name: "Swagger API Team",
      email: "apiteam@swagger.io",
      url: "http://swagger.io",
    },
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
  },
  servers: [
    {
      url: "http://petstore.swagger.io/api",
    },
  ],
  paths: {
    "/pets": {
      get: {
        description:
          "Returns all pets from the system that the user has access to\nNam sed condimentum est. Maecenas tempor sagittis sapien, nec rhoncus sem sagittis sit amet. Aenean at gravida augue, ac iaculis sem. Curabitur odio lorem, ornare eget elementum nec, cursus id lectus. Duis mi turpis, pulvinar ac eros ac, tincidunt varius justo. In hac habitasse platea dictumst. Integer at adipiscing ante, a sagittis ligula. Aenean pharetra tempor ante molestie imperdiet. Vivamus id aliquam diam. Cras quis velit non tortor eleifend sagittis. Praesent at enim pharetra urna volutpat venenatis eget eget mauris. In eleifend fermentum facilisis. Praesent enim enim, gravida ac sodales sed, placerat id erat. Suspendisse lacus dolor, consectetur non augue vel, vehicula interdum libero. Morbi euismod sagittis libero sed lacinia.\n\nSed tempus felis lobortis leo pulvinar rutrum. Nam mattis velit nisl, eu condimentum ligula luctus nec. Phasellus semper velit eget aliquet faucibus. In a mattis elit. Phasellus vel urna viverra, condimentum lorem id, rhoncus nibh. Ut pellentesque posuere elementum. Sed a varius odio. Morbi rhoncus ligula libero, vel eleifend nunc tristique vitae. Fusce et sem dui. Aenean nec scelerisque tortor. Fusce malesuada accumsan magna vel tempus. Quisque mollis felis eu dolor tristique, sit amet auctor felis gravida. Sed libero lorem, molestie sed nisl in, accumsan tempor nisi. Fusce sollicitudin massa ut lacinia mattis. Sed vel eleifend lorem. Pellentesque vitae felis pretium, pulvinar elit eu, euismod sapien.\n",
        operationId: "findPets",
        parameters: [
          {
            name: "tags",
            in: "query",
            description: "tags to filter by",
            required: false,
            style: "form",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          {
            name: "limit",
            in: "query",
            description: "maximum number of results to return",
            required: false,
            schema: {
              type: "integer",
              format: "int32",
            },
          },
        ],
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
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      post: {
        description: "Creates a new pet in the store.  Duplicates are allowed",
        operationId: "addPet",
        requestBody: {
          description: "Pet to add to the store",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NewPet",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "pet response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/pets/{id}": {
      get: {
        description:
          "Returns a user based on a single ID, if the user does not have access to the pet",
        operationId: "find pet by id",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of pet to fetch",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          "200": {
            description: "pet response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      delete: {
        description: "deletes a single pet based on the ID supplied",
        operationId: "deletePet",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of pet to delete",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          "204": {
            description: "pet deleted",
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      patch: {
        description: "Updates a pet in the store.",
        operationId: "updatePet",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of pet to update",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        requestBody: {
          $ref: "#/components/requestBodies/updatePetRequest",
        },
        responses: {
          "200": {
            description: "pet response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Pet",
                },
              },
            },
          },
          default: {
            description: "unexpected error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      idParam: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          description: "Unique identifier",
          type: "string",
        },
      },
      petFilterParam: {
        name: "petFilter",
        in: "query",
        required: false,
        schema: {
          description: "Filter by type",
          type: "string",
          enum: ["cat", "dog"],
        },
      },
    },
    requestBodies: {
      updatePetRequest: {
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/NewPet",
            },
          },
        },
        required: true,
      },
      searchPetRequest: {
        content: {
          "application/json": {
            schema: {
              type: "string",
              enum: ["cat", "dog"],
            },
          },
        },
        required: true,
      },
    },
    responses: {
      NotModified: {
        description: "Not modified",
      },
      PetResponse: {
        description: "A pet",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Pet",
            },
          },
        },
      },
      PetTypeResponse: {
        description: "Type of pet",
        content: {
          "application/json": {
            schema: {
              type: "string",
              enum: ["cat", "dog"],
            },
          },
        },
      },
    },
    schemas: {
      Pet: {
        description: "A pet.",
        allOf: [
          {
            $ref: "#/components/schemas/NewPet",
          },
          {
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "integer",
                format: "int64",
              },
            },
          },
        ],
      },
      NewPet: {
        description: "A new pet.",
        type: "object",
        required: ["name"],
        properties: {
          name: {
            type: "string",
          },
          tag: {
            type: "string",
          },
        },
      },
      CatOrDog: {
        description: "A discriminator example.",
        oneOf: [
          {
            $ref: "#/components/schemas/Cat",
          },
          {
            $ref: "#/components/schemas/Dog",
          },
        ],
        discriminator: {
          propertyName: "type",
          mapping: {
            cat: "#/components/schemas/Cat",
            dog: "#/components/schemas/Dog",
          },
        },
      },
      Cat: {
        description: "A cat, meow.",
        type: "object",
        properties: {
          type: {
            type: "string",
          },
          breed: {
            type: "string",
            enum: ["labrador", "carlin", "beagle"],
          },
        },
        required: ["type", "breed"],
      },
      Dog: {
        description: "A dog, wooof.",
        type: "object",
        properties: {
          type: {
            type: "string",
          },
          breed: {
            type: "string",
            enum: ["saimois", "bengal", "british shorthair"],
          },
        },
        required: ["type", "breed"],
      },
      Error: {
        description: "An error :(",
        type: "object",
        required: ["code", "message"],
        properties: {
          code: {
            type: "integer",
            format: "int32",
          },
          message: {
            type: "string",
          },
        },
      },
      Request: {
        description: "Request description",
        type: "object",
        properties: {
          action: {
            type: "array",
            items: {
              type: "string",
              enum: ["create", "read", "update", "delete"],
            },
          },
        },
      },
    },
  },
};
