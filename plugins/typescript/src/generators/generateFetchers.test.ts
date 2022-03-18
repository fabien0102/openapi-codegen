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
          tags: ["pets"],
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

  it("should genarate fetchers", async () => {
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

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "/**
       * Generated by @openapi-codegen
       * 
       * @version 1.0.0
       */
      import { petstoreFetch } from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      export type ListPetsResponse = Schemas.Pet[];

      /**
       * Get all the pets
       */
      export const listPets = () => petstoreFetch<ListPetsResponse, undefined, {}, {}, {}>({ url: \\"/pets\\", method: \\"get\\" });

      export const operationsByTag = { \\"pets\\": { listPets } };
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

    expect(writeFile.mock.calls[0][0]).toBe("petstoreComponents.ts");
    expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
      "/**
       * Generated by @openapi-codegen
       * 
       * @version 1.0.0
       */
      import { petstoreFetch, PetstoreFetcherExtraProps } from \\"./petstoreFetcher\\";
      import type * as Schemas from \\"./petstoreSchemas\\";

      export type ListPetsResponse = Schemas.Pet[];

      export type ListPetsVariables = PetstoreFetcherExtraProps;

      /**
       * Get all the pets
       */
      export const listPets = (variables: ListPetsVariables) => petstoreFetch<ListPetsResponse, undefined, {}, {}, {}>({ url: \\"/pets\\", method: \\"get\\", ...variables });

      export const operationsByTag = { \\"pets\\": { listPets } };
      "
    `);
  });
});
