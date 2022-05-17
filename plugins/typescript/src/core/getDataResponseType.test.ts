import { ResponsesObject } from "openapi3-ts";
import { print } from "../testUtils";
import { getDataResponseType } from "./getDataResponseType";

describe("getDataResponseType", () => {
  it("should extract the response type with 200 status", () => {
    const responses: ResponsesObject = {
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
    };

    const responseType = getDataResponseType({
      responses,
      printNodes: (nodes) => nodes.map(print).join("\n"),
    });

    expect(print(responseType)).toMatchInlineSnapshot(`"Schemas.Pet[]"`);
  });

  it("should remove duplicate responses", () => {
    const responses: ResponsesObject = {
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
      "203": {
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
    };

    const responseType = getDataResponseType({
      responses,
      printNodes: (nodes) => nodes.map(print).join("\n"),
    });

    expect(print(responseType)).toMatchInlineSnapshot(`"Schemas.Pet[]"`);
  });

  it("should create a union", () => {
    const responses: ResponsesObject = {
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
      "203": {
        description: "pet response",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Cat",
              },
            },
          },
        },
      },
    };

    const responseType = getDataResponseType({
      responses,
      printNodes: (nodes) => nodes.map(print).join("\n"),
    });

    expect(print(responseType)).toMatchInlineSnapshot(
      `"Schemas.Pet[] | Schemas.Cat[]"`
    );
  });

  it("should returns undefined when no response", () => {
    const responses: ResponsesObject = {};

    const responseType = getDataResponseType({
      responses,
      printNodes: (nodes) => nodes.map(print).join("\n"),
    });

    expect(print(responseType)).toMatchInlineSnapshot(`"undefined"`);
  });
});
