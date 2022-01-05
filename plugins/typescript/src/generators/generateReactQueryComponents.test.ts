import { OpenAPIObject } from "openapi3-ts";
import {
  Config,
  generateReactQueryComponents,
} from "./generateReactQueryComponents";

const config: Config = {
  filenamePrefix: "petstore",
  schemasFiles: {
    parameters: "petstoreParameters",
    schemas: "petstoreSchemas",
    responses: "petstoreResponses",
    requestBodies: "petstoreRequestBodies",
  },
};

describe("generateReactQueryComponents", () => {
  it("should inject the customFetch import", async () => {
    const writeFile = jest.fn();
    const openAPIDocument: OpenAPIObject = {
      openapi: "3.0.0",
      info: {
        title: "petshop",
        version: "1.0.0",
      },
      paths: {},
    };

    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => false, // customFetcher is not there
      },
      config
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreFetcher.ts");
  });

  it("should generate a useQuery wrapper (no parameters)", async () => {
    const writeFile = jest.fn();
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

    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "import * as reactQuery from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      export type ListPetsResponse = Schemas.Pet[];

      /**
       * Get all the pets
       */
      export const fetchListPets = () => petstoreFetch<ListPetsResponse, undefined, undefined, undefined, undefined>({ url: \\"/pets\\", method: \\"get\\" });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends reactQuery.QueryKey>(queryKey: TQueryKey, options?: Omit<reactQuery.UseQueryOptions<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => reactQuery.useQuery<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>(queryKey, fetchListPets, options);
      "
    `);
  });

  it("should generate a useQuery wrapper (with queryParams)", async () => {
    const writeFile = jest.fn();
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
            parameters: [
              {
                in: "query",
                name: "breed",
                description: "Filter on the dog breed",
                required: true,
                schema: {
                  type: "string",
                },
              },
              { $ref: "#/components/parameters/colorParam" },
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
            },
          },
        },
      },
      components: {
        parameters: {
          colorParam: {
            in: "query",
            description: "Color of the dog",
            name: "color",
            schema: {
              type: "string",
              enum: ["white", "black", "grey"],
            },
          },
        },
      },
    };

    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "import * as reactQuery from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      export type ListPetsQueryParams = {
          /*
           * Filter on the dog breed
           */
          breed: string;
          /*
           * Color of the dog
           */
          color?: \\"white\\" | \\"black\\" | \\"grey\\";
      };

      export type ListPetsResponse = Schemas.Pet[];

      export type ListPetsVariables = {
          queryParams: ListPetsQueryParams;
      };

      /**
       * Get all the pets
       */
      export const fetchListPets = (variables: ListPetsVariables) => petstoreFetch<ListPetsResponse, undefined, undefined, ListPetsQueryParams, undefined>({ url: \\"/pets\\", method: \\"get\\", ...variables });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends reactQuery.QueryKey>(queryKey: TQueryKey, variables: ListPetsVariables, options?: Omit<reactQuery.UseQueryOptions<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => reactQuery.useQuery<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>(queryKey, () => fetchListPets(variables), options);
      "
    `);
  });

  it("should deal with injected headers (marked them as optional)", async () => {
    const writeFile = jest.fn();
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
            parameters: [
              {
                in: "header",
                name: "breed",
                description: "Filter on the dog breed",
                required: true,
                schema: {
                  type: "string",
                },
              },
              { $ref: "#/components/parameters/colorParam" },
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
            },
          },
        },
      },
      components: {
        parameters: {
          colorParam: {
            in: "query",
            description: "Color of the dog",
            name: "color",
            schema: {
              type: "string",
              enum: ["white", "black", "grey"],
            },
          },
        },
      },
    };

    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => true,
      },
      { ...config, injectedHeaders: ["breed"] }
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "import * as reactQuery from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      export type ListPetsQueryParams = {
          /*
           * Color of the dog
           */
          color?: \\"white\\" | \\"black\\" | \\"grey\\";
      };

      export type ListPetsHeaders = {
          /*
           * Filter on the dog breed
           */
          breed?: string;
      };

      export type ListPetsResponse = Schemas.Pet[];

      export type ListPetsVariables = {
          headers: ListPetsHeaders;
          queryParams: ListPetsQueryParams;
      };

      /**
       * Get all the pets
       */
      export const fetchListPets = (variables: ListPetsVariables) => petstoreFetch<ListPetsResponse, undefined, ListPetsHeaders, ListPetsQueryParams, undefined>({ url: \\"/pets\\", method: \\"get\\", ...variables });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends reactQuery.QueryKey>(queryKey: TQueryKey, variables: ListPetsVariables, options?: Omit<reactQuery.UseQueryOptions<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => reactQuery.useQuery<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>(queryKey, () => fetchListPets(variables), options);
      "
    `);
  });

  it("should not generated duplicated types", async () => {
    const writeFile = jest.fn();
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
              "201": {
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

    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "import * as reactQuery from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      export type ListPetsResponse = Schemas.Pet[];

      /**
       * Get all the pets
       */
      export const fetchListPets = () => petstoreFetch<ListPetsResponse, undefined, undefined, undefined, undefined>({ url: \\"/pets\\", method: \\"get\\" });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends reactQuery.QueryKey>(queryKey: TQueryKey, options?: Omit<reactQuery.UseQueryOptions<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => reactQuery.useQuery<ListPetsResponse, undefined, ListPetsResponse, TQueryKey>(queryKey, fetchListPets, options);
      "
    `);
  });

  it("should generate useMutation for POST operation", async () => {
    const writeFile = jest.fn();
    const openAPIDocument: OpenAPIObject = {
      openapi: "3.0.0",
      info: {
        title: "petshop",
        version: "1.0.0",
      },
      paths: {
        "/pet": {
          post: {
            operationId: "AddPet",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                      color: {
                        type: "string",
                      },
                      breed: {
                        type: "string",
                      },
                      age: {
                        type: "integer",
                      },
                    },
                    required: ["name", "breed", "age"],
                  },
                },
              },
            },
            responses: {
              200: {
                content: {
                  "application/json": {
                    description: "Successful response",
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              500: {
                content: {
                  "application/json": {
                    description: "An Error",
                    schema: {
                      type: "object",
                      properties: {
                        code: {
                          type: "integer",
                          enum: [500],
                        },
                        message: {
                          type: "string",
                        },
                      },
                      required: ["code", "message"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "import * as reactQuery from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetcher\\";

      export type AddPetError = {
          code: 500;
          message: string;
      };

      export type AddPetRequestBody = {
          name: string;
          color?: string;
          breed: string;
          age: number;
      };

      export type AddPetVariables = {
          body: AddPetRequestBody;
      };

      export const fetchAddPet = (variables: AddPetVariables) => petstoreFetch<string, AddPetRequestBody, undefined, undefined, undefined>({ url: \\"/pet\\", method: \\"post\\", ...variables });

      export const useAddPet = (options?: Omit<reactQuery.UseMutationOptions<string, AddPetError, AddPetVariables>, \\"mutationFn\\">) => {
          return reactQuery.useMutation<string, AddPetError, AddPetVariables>(fetchAddPet, options);
      };
      "
    `);
  });

  it("should resolve requestBody ref", async () => {
    const writeFile = jest.fn();
    const openAPIDocument: OpenAPIObject = {
      openapi: "3.0.0",
      info: {
        title: "petshop",
        version: "1.0.0",
      },
      components: {
        requestBodies: {
          dog: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                    color: {
                      type: "string",
                    },
                    breed: {
                      type: "string",
                    },
                    age: {
                      type: "integer",
                    },
                  },
                  required: ["name", "breed", "age"],
                },
              },
            },
          },
        },
      },
      paths: {
        "/pet": {
          post: {
            operationId: "AddPet",
            requestBody: {
              $ref: "#/components/requestBodies/dog",
            },
            responses: {
              200: {
                content: {
                  "application/json": {
                    description: "Successful response",
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
              500: {
                content: {
                  "application/json": {
                    description: "An Error",
                    schema: {
                      type: "object",
                      properties: {
                        code: {
                          type: "integer",
                          enum: [500],
                        },
                        message: {
                          type: "string",
                        },
                      },
                      required: ["code", "message"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "import * as reactQuery from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetcher\\";
      import type * as RequestBodies from \\"./petstoreRequestBodies\\";

      export type AddPetError = {
          code: 500;
          message: string;
      };

      export type AddPetVariables = {
          body: RequestBodies.Dog;
      };

      export const fetchAddPet = (variables: AddPetVariables) => petstoreFetch<string, RequestBodies.Dog, undefined, undefined, undefined>({ url: \\"/pet\\", method: \\"post\\", ...variables });

      export const useAddPet = (options?: Omit<reactQuery.UseMutationOptions<string, AddPetError, AddPetVariables>, \\"mutationFn\\">) => {
          return reactQuery.useMutation<string, AddPetError, AddPetVariables>(fetchAddPet, options);
      };
      "
    `);
  });

  it("should deal with pathParams", async () => {
    const writeFile = jest.fn();
    const openAPIDocument: OpenAPIObject = {
      openapi: "3.0.0",
      info: {
        title: "petshop",
        version: "1.0.0",
      },
      paths: {
        "/pet/{pet_id}": {
          parameters: [
            {
              in: "path",
              name: "pet_id",
              schema: {
                type: "string",
              },
              required: true,
            },
          ],
          put: {
            operationId: "updatePet",
            requestBody: {
              $ref: "#/components/requestBodies/UpdatePetRequestBody",
            },
            responses: {
              200: {
                content: {
                  "application/json": {
                    description: "Successful response",
                    schema: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    await generateReactQueryComponents(
      {
        openAPIDocument,
        writeFile,
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "import * as reactQuery from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetcher\\";
      import type * as RequestBodies from \\"./petstoreRequestBodies\\";

      export type UpdatePetPathParams = {
          petId: string;
      };

      export type UpdatePetVariables = {
          body: RequestBodies.UpdatePetRequestBody;
          pathParams: UpdatePetPathParams;
      };

      export const fetchUpdatePet = (variables: UpdatePetVariables) => petstoreFetch<string, RequestBodies.UpdatePetRequestBody, undefined, undefined, UpdatePetPathParams>({ url: \\"/pet/{petId}\\", method: \\"put\\", ...variables });

      export const useUpdatePet = (options?: Omit<reactQuery.UseMutationOptions<string, undefined, UpdatePetVariables>, \\"mutationFn\\">) => {
          return reactQuery.useMutation<string, undefined, UpdatePetVariables>(fetchUpdatePet, options);
      };
      "
    `);
  });
});
