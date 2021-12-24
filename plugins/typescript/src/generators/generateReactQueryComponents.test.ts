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
      "import { useQuery, QueryKey, UseQueryOptions } from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetch\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      /**
       * Get all the pets
       */
      export const fetchListPets = () => petstoreFetch<Schemas.Pet[]>({ url: \\"/pets\\", method: \\"get\\" });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends QueryKey>(queryKey: TQueryKey, options?: Omit<UseQueryOptions<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => useQuery<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>(queryKey, fetchListPets, options);
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
      "import { useQuery, QueryKey, UseQueryOptions } from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetch\\";
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

      /**
       * Get all the pets
       */
      export const fetchListPets = (options: {
          queryParams: ListPetsQueryParams;
      }) => petstoreFetch<Schemas.Pet[]>({ url: \\"/pets\\", method: \\"get\\", ...options });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends QueryKey>(queryKey: TQueryKey, options?: Omit<UseQueryOptions<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => useQuery<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>(queryKey, fetchListPets, options);
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
      "import { useQuery, QueryKey, UseQueryOptions } from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetch\\";
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

      /**
       * Get all the pets
       */
      export const fetchListPets = (options: {
          headers: ListPetsHeaders;
          queryParams: ListPetsQueryParams;
      }) => petstoreFetch<Schemas.Pet[]>({ url: \\"/pets\\", method: \\"get\\", ...options });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends QueryKey>(queryKey: TQueryKey, options?: Omit<UseQueryOptions<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => useQuery<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>(queryKey, fetchListPets, options);
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
      "import { useQuery, QueryKey, UseQueryOptions } from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetch\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      /**
       * Get all the pets
       */
      export const fetchListPets = () => petstoreFetch<Schemas.Pet[]>({ url: \\"/pets\\", method: \\"get\\" });

      /**
       * Get all the pets
       */
      export const useListPets = <TQueryKey extends QueryKey>(queryKey: TQueryKey, options?: Omit<UseQueryOptions<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>, \\"queryKey\\" | \\"queryFn\\">) => useQuery<Schemas.Pet[], void, Schemas.Pet[], TQueryKey>(queryKey, fetchListPets, options);
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
      "import { useQuery, QueryKey, UseQueryOptions } from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetch\\";

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

      export const fetchAddPet = () => petstoreFetch<string>({ url: \\"/pet\\", method: \\"post\\" });

      const useAddPet = (options: Omit<UseMutationOptions<string, AddPetError, AddPetRequestBody>, \\"mutationFn\\">) => {
          return useMutation<string, AddPetError, AddPetRequestBody>(fetchAddPet, options);
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
      "import { useQuery, QueryKey, UseQueryOptions } from \\"react-query\\";
      import petstoreFetch from \\"./petstoreFetch\\";
      import type * as RequestBodies from \\"./petstoreRequestBodies\\";

      export type AddPetError = {
          code: 500;
          message: string;
      };

      export const fetchAddPet = () => petstoreFetch<string>({ url: \\"/pet\\", method: \\"post\\" });

      const useAddPet = (options: Omit<UseMutationOptions<string, AddPetError, RequestBodies.Dog>, \\"mutationFn\\">) => {
          return useMutation<string, AddPetError, RequestBodies.Dog>(fetchAddPet, options);
      };
      "
    `);
  });
});
