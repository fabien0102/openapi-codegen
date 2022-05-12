import { set } from "lodash";
import { OpenAPIObject } from "openapi3-ts";
import { Config, generateFetchers } from "./generateFetchers";

const config: Config = {
  filenamePrefix: "petstore",
  schemasFiles: {
    parameters: "petstoreParameters",
    schemas: "petstoreSchemas",
    responses: "petstoreResponses",
    requestBodies: "petstoreRequestBodies",
  },
};

describe("generateFetchers", () => {
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
            "404": {
              description: "not found",
              $ref: "#/components/responses/NotFoundError",
            },
            "5xx": {
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
  };

  it("should generate fetchers", async () => {
    const writeFile = jest.fn();

    await generateFetchers(
      {
        openAPIDocument,
        writeFile,
        readFile: async () => "",
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[1][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[1][1]).toMatchInlineSnapshot(`
      "/**
       * Generated by @openapi-codegen
       * 
       * @version 1.0.0
       */
      import type * as Fetcher from \\"./petstoreFetcher\\";
      import { petstoreFetch } from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";
      import type * as Responses from \\"./petstoreResponses\\";
      import { ServerErrorStatus } from \\"././petstoreUtils\\";

      export type ListPetsError = Fetcher.ErrorWrapper<{
          status: 404;
          payload: Responses.NotFoundError;
      } | {
          status: ServerErrorStatus;
          payload: Schemas.Error;
      }>;

      export type ListPetsResponse = Schemas.Pet[];

      /**
       * Get all the pets
       */
      export const listPets = () => petstoreFetch<ListPetsResponse, ListPetsError, undefined, {}, {}, {}>({ url: \\"/pets\\", method: \\"get\\" });
      "
    `);
  });

  it("should generate fetchers without prefix", async () => {
    const writeFile = jest.fn();

    await generateFetchers(
      {
        openAPIDocument,
        writeFile,
        readFile: async () => "",
        existsFile: () => true,
      },
      { ...config, filenamePrefix: "" }
    );

    expect(writeFile.mock.calls[1][0]).toBe("components.ts");
    expect(writeFile.mock.calls[1][1]).toMatchInlineSnapshot(`
      "/**
       * Generated by @openapi-codegen
       * 
       * @version 1.0.0
       */
      import type * as Fetcher from \\"./fetcher\\";
      import { fetch } from \\"./fetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";
      import type * as Responses from \\"./petstoreResponses\\";
      import { ServerErrorStatus } from \\"././utils\\";

      export type ListPetsError = Fetcher.ErrorWrapper<{
          status: 404;
          payload: Responses.NotFoundError;
      } | {
          status: ServerErrorStatus;
          payload: Schemas.Error;
      }>;

      export type ListPetsResponse = Schemas.Pet[];

      /**
       * Get all the pets
       */
      export const listPets = () => fetch<ListPetsResponse, ListPetsError, undefined, {}, {}, {}>({ url: \\"/pets\\", method: \\"get\\" });
      "
    `);
  });

  it("should generate fetcher with injected props", async () => {
    const writeFile = jest.fn();

    await generateFetchers(
      {
        openAPIDocument,
        writeFile,
        readFile: async () => `
        export type PetstoreFetcherExtraProps = {
          /**
           * Treat 404 errors as success
           */
          byPassNotFound?: boolean;
        };
        `,
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[1][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[1][1]).toMatchInlineSnapshot(`
      "/**
       * Generated by @openapi-codegen
       * 
       * @version 1.0.0
       */
      import type * as Fetcher from \\"./petstoreFetcher\\";
      import { petstoreFetch, PetstoreFetcherExtraProps } from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";
      import type * as Responses from \\"./petstoreResponses\\";
      import { ServerErrorStatus } from \\"././petstoreUtils\\";

      export type ListPetsError = Fetcher.ErrorWrapper<{
          status: 404;
          payload: Responses.NotFoundError;
      } | {
          status: ServerErrorStatus;
          payload: Schemas.Error;
      }>;

      export type ListPetsResponse = Schemas.Pet[];

      export type ListPetsVariables = PetstoreFetcherExtraProps;

      /**
       * Get all the pets
       */
      export const listPets = (variables: ListPetsVariables) => petstoreFetch<ListPetsResponse, ListPetsError, undefined, {}, {}, {}>({ url: \\"/pets\\", method: \\"get\\", ...variables });
      "
    `);
  });

  it("should generate fetcher with operations by tag", async () => {
    const writeFile = jest.fn();

    const openAPIDocumentWithTags = set(
      openAPIDocument,
      "paths./pets.get.tags",
      ["pets"]
    );

    await generateFetchers(
      {
        openAPIDocument: openAPIDocumentWithTags,
        writeFile,
        readFile: async () => "",
        existsFile: () => true,
      },
      config
    );

    expect(writeFile.mock.calls[1][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[1][1]).toMatchInlineSnapshot(`
      "/**
       * Generated by @openapi-codegen
       * 
       * @version 1.0.0
       */
      import type * as Fetcher from \\"./petstoreFetcher\\";
      import { petstoreFetch } from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";
      import type * as Responses from \\"./petstoreResponses\\";
      import { ServerErrorStatus } from \\"././petstoreUtils\\";

      export type ListPetsError = Fetcher.ErrorWrapper<{
          status: 404;
          payload: Responses.NotFoundError;
      } | {
          status: ServerErrorStatus;
          payload: Schemas.Error;
      }>;

      export type ListPetsResponse = Schemas.Pet[];

      /**
       * Get all the pets
       */
      export const listPets = () => petstoreFetch<ListPetsResponse, ListPetsError, undefined, {}, {}, {}>({ url: \\"/pets\\", method: \\"get\\" });

      export const operationsByTag = { \\"pets\\": { listPets } };
      "
    `);
  });
});
