import { petstore } from "../fixtures/petstore";
import { generateSchemaTypes } from "./generateSchemaTypes";

describe("generateSchemaTypes", () => {
  describe("filenameCase option", () => {
    it("should generate files in camel case", () => {
      const writeFile = jest.fn();
      generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "camel",
        }
      );
      expect(writeFile.mock.calls[0][0]).toBe("swaggerPetstoreSchemas.ts");
    });

    it("should generate files in snake case", () => {
      const writeFile = jest.fn();
      generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "snake",
        }
      );
      expect(writeFile.mock.calls[0][0]).toBe("swagger_petstore_schemas.ts");
    });

    it("should generate files in kebab case", () => {
      const writeFile = jest.fn();
      generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "kebab",
        }
      );
      expect(writeFile.mock.calls[0][0]).toBe("swagger-petstore-schemas.ts");
    });

    it("should generate files in pascal case", () => {
      const writeFile = jest.fn();
      generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "pascal",
        }
      );
      expect(writeFile.mock.calls[0][0]).toBe("SwaggerPetstoreSchemas.ts");
    });
  });

  describe("filenamePrefix option", () => {
    it("should take have the correct prefix", () => {
      const writeFile = jest.fn();
      generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "camel",
          filenamePrefix: "petstore",
        }
      );
      expect(writeFile.mock.calls[0][0]).toBe("petstoreSchemas.ts");
    });
  });

  describe("schemas file generation", () => {
    it("should generate the schemas file", async () => {
      const writeFile = jest.fn();
      await generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "camel",
        }
      );
      expect(writeFile.mock.calls[0][0]).toBe("swaggerPetstoreSchemas.ts");
      expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
        "/**
         * A new pet.
         */
        export type Pet = NewPet & {
            /*
             * @format int64
             */
            id: number;
        };

        /**
         * A new pet.
         */
        export type NewPet = {
            name: string;
            tag?: string;
        };

        /**
         * A discriminator example.
         */
        export type CatOrDog = (Omit<Cat, \\"type\\"> & {
            type: \\"cat\\";
        }) | (Omit<Dog, \\"type\\"> & {
            type: \\"dog\\";
        });

        /**
         * A cat, meow.
         */
        export type Cat = {
            type: string;
            breed: \\"labrador\\" | \\"carlin\\" | \\"beagle\\";
        };

        /**
         * A dog, wooof.
         */
        export type Dog = {
            type: string;
            breed: \\"saimois\\" | \\"bengal\\" | \\"british shorthair\\";
        };

        /**
         * An error :(
         */
        export type Error = {
            /*
             * @format int32
             */
            code: number;
            message: string;
        };

        /**
         * Request description
         */
        export type Request = {
            action?: (\\"create\\" | \\"read\\" | \\"update\\" | \\"delete\\")[];
        };
        "
      `);
    });

    it("should generate the responses file", async () => {
      const writeFile = jest.fn();
      await generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "camel",
        }
      );
      expect(writeFile.mock.calls[1][0]).toBe("swaggerPetstoreResponses.ts");
      expect(writeFile.mock.calls[1][1]).toMatchInlineSnapshot(`
        "import type * as Schemas from \\"./swaggerPetstoreSchemas\\";

        export type PetResponse = Schemas.Pet;
        "
      `);
    });

    it("should generate the request bodies file", async () => {
      const writeFile = jest.fn();
      await generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "camel",
        }
      );
      expect(writeFile.mock.calls[2][0]).toBe(
        "swaggerPetstoreRequestBodies.ts"
      );
      expect(writeFile.mock.calls[2][1]).toMatchInlineSnapshot(`
        "import type * as Schemas from \\"./swaggerPetstoreSchemas\\";

        export type UpdatePetRequest = Schemas.NewPet;
        "
      `);
    });

    it("should generate the parameters file", async () => {
      const writeFile = jest.fn();
      await generateSchemaTypes(
        { openAPIDocument: petstore, writeFile },
        {
          filenameCase: "camel",
        }
      );
      expect(writeFile.mock.calls[3][0]).toBe("swaggerPetstoreParameters.ts");
      expect(writeFile.mock.calls[3][1]).toMatchInlineSnapshot(`
        "/**
         * Unique identifier
         */
        export type IdParam = string;
        "
      `);
    });
  });
});
