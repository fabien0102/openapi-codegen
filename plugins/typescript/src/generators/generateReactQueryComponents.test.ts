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
  // it("should inject the customFetch import", () => {});
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
});
