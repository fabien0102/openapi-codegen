import { isRequestBodyOptional } from "./isRequestBodyOptional";

describe("isRequestBodyOptional", () => {
  it("should return true if no requestBody", () => {
    expect(isRequestBodyOptional({})).toBe(true);
  });

  it("should return true if requestBody don’t have any required properties", () => {
    expect(
      isRequestBodyOptional({
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  foo: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      })
    ).toBe(true);
  });

  it("should return false if requestBody have any required properties", () => {
    expect(
      isRequestBodyOptional({
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  foo: {
                    type: "string",
                  },
                },
                required: ["foo"],
              },
            },
          },
        },
      })
    ).toBe(false);
  });

  it("should resolve requestBody ref", () => {
    expect(
      isRequestBodyOptional({
        requestBody: {
          $ref: "#/components/requestBodies/FooRequest",
        },
        components: {
          requestBodies: {
            FooRequest: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      foo: {
                        type: "string",
                      },
                    },
                    required: ["foo"],
                  },
                },
              },
            },
          },
        },
      })
    ).toBe(false);
  });

  it("should resolve schema ref", () => {
    expect(
      isRequestBodyOptional({
        requestBody: {
          $ref: "#/components/requestBodies/FooRequest",
        },
        components: {
          schemas: {
            Foo: {
              type: "object",
              properties: {
                foo: {
                  type: "string",
                },
              },
              required: ["foo"],
            },
          },
          requestBodies: {
            FooRequest: {
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Foo",
                  },
                },
              },
            },
          },
        },
      })
    ).toBe(false);
  });

  it("should resolve with dots in names", () => {
    expect(
      isRequestBodyOptional({
        requestBody: {
          $ref: "#/components/requestBodies/Foo.Request",
        },
        components: {
          requestBodies: {
            "Foo.Request": {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      foo: {
                        type: "string",
                      },
                    },
                    required: ["foo"],
                  },
                },
              },
            },
          },
        },
      })
    ).toBe(false);
  });
});
