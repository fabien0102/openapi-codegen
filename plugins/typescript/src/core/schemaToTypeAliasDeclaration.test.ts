import { OpenAPIObject, ReferenceObject, SchemaObject } from "openapi3-ts";
import ts from "typescript";
import {
  OpenAPIComponentType,
  schemaToTypeAliasDeclaration,
} from "./schemaToTypeAliasDeclaration";

describe("schemaToTypeAliasDeclaration", () => {
  it("should generate null", () => {
    const schema: SchemaObject = {
      type: "null",
    };

    expect(printSchema(schema)).toBe("export type Test = null;");
  });

  it("should generate integer", () => {
    const schema: SchemaObject = {
      type: "integer",
    };

    expect(printSchema(schema)).toBe("export type Test = number;");
  });

  it("should generate string", () => {
    const schema: SchemaObject = {
      type: "string",
    };

    expect(printSchema(schema)).toBe("export type Test = string;");
  });

  it("should generate boolean", () => {
    const schema: SchemaObject = {
      type: "boolean",
    };

    expect(printSchema(schema)).toBe("export type Test = boolean;");
  });

  it("should generate a nullable value", () => {
    const schema: SchemaObject = {
      type: "integer",
      nullable: true,
    };

    expect(printSchema(schema)).toBe("export type Test = number | null;");
  });

  it("should generate an array of numbers", () => {
    const schema: SchemaObject = {
      type: "array",
      items: {
        type: "integer",
      },
    };

    expect(printSchema(schema)).toBe("export type Test = number[];");
  });

  it("should generate enums (strings)", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: ["foo", "bar", "baz"],
    };

    expect(printSchema(schema)).toBe(
      `export type Test = "foo" | "bar" | "baz";`
    );
  });

  it("should reference to an previously created enum", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["AVAILABLE", "PENDING", "SOLD"],
        },
      },
      xml: { name: "pet" },
    };

    const components: OpenAPIObject["components"] = {
      schemas: {
        Pet: schema,
      },
    };

    expect(printSchema(schema, "schemas", components, true))
      .toMatchInlineSnapshot(`
      "export type Test = {
          status?: TestStatus;
      };"
    `);
  });

  it("should generate nullable enums (strings)", () => {
    const schema: SchemaObject = {
      type: "string",
      enum: ["foo", "bar", "baz"],
      nullable: true,
    };

    expect(printSchema(schema)).toBe(
      `export type Test = "foo" | "bar" | "baz" | null;`
    );
  });

  it("should generate enums (numbers)", () => {
    const schema: SchemaObject = {
      type: "integer",
      enum: [1, 2, 3],
    };

    expect(printSchema(schema)).toBe(`export type Test = 1 | 2 | 3;`);
  });

  it("should skip example which contains `*/` to avoid confusion", () => {
    const schema: SchemaObject = {
      title: "CronTimingCreate",
      required: ["type", "cron_expression"],
      type: "object",
      properties: {
        cron_expression: {
          title: "Cron Expression",
          type: "string",
          description: "The string representing the timing's cron expression.",
          format: "cron-string",
          example: "*/5 * * * *", // `*/` is conflicting the multiline comment syntax
        },
      },
      additionalProperties: false,
      description: "Cron timing schema for create requests.",
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "/**
       * Cron timing schema for create requests.
       */
      export type Test = {
          /**
           * The string representing the timing's cron expression.
           *
           * @format cron-string
           * @example [see original specs]
           */
          cron_expression: string;
      };"
    `);
  });

  it("should generate top-level documentation", () => {
    const schema: SchemaObject = {
      type: "null",
      description: "I’m null",
      maximum: 43,
      minimum: 42,
      default: "42",
      format: "int32",
      deprecated: true,
      exclusiveMaximum: true,
      exclusiveMinimum: false,
      example: "I’m an example",
      "x-test": "plop",
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "/**
       * I’m null
       * 
       * @maximum 43
       * @minimum 42
       * @default 42
       * @format int32
       * @deprecated true
       * @exclusiveMaximum true
       * @exclusiveMinimum false
       * @example I’m an example
       * @x-test plop
       */
      export type Test = null;"
    `);
  });

  it("should generate multiple examples", () => {
    const schema: SchemaObject = {
      type: "null",
      examples: ["first example", "second example"],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "/**
       * @example first example
       * @example second example
       */
      export type Test = null;"
    `);
  });

  it("should generate multiple examples (with singular)", () => {
    const schema: SchemaObject = {
      type: "null",
      example: ["first example", "second example"],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "/**
       * @example first example
       * @example second example
       */
      export type Test = null;"
    `);
  });

  it("should generate an object", () => {
    const schema: SchemaObject = {
      type: "object",
      description: "An object",
      properties: {
        foo: {
          description: "I’m a foo",
          default: "boom",
          type: "string",
        },
        bar: {
          minimum: 0,
          maximum: 42,
          type: "number",
        },
        baz: {
          type: "boolean",
        },
      },
      required: ["foo"],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "/**
       * An object
       */
      export type Test = {
          /**
           * I’m a foo
           *
           * @default boom
           */
          foo: string;
          /**
           * @minimum 0
           * @maximum 42
           */
          bar?: number;
          baz?: boolean;
      };"
    `);
  });

  it("should generate an object with escaped keys", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        ["foo.bar"]: {
          type: "string",
        },
      },
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          [\\"foo.bar\\"]?: string;
      };"
    `);
  });

  it("should generate a nested object", () => {
    const schema: SchemaObject = {
      type: "object",
      description: "An object",
      properties: {
        foo: {
          description: "I’m a foo",
          default: "boom",
          type: "object",
          properties: {
            bar: {
              minimum: 0,
              maximum: 42,
              type: "number",
            },
            baz: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  oh: {
                    default: "yeah",
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      required: ["foo"],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "/**
       * An object
       */
      export type Test = {
          /**
           * I’m a foo
           *
           * @default boom
           */
          foo: {
              /**
               * @minimum 0
               * @maximum 42
               */
              bar?: number;
              baz?: {
                  /**
                   * @default yeah
                   */
                  oh?: string;
              }[];
          };
      };"
    `);
  });

  it("should resolve ref", () => {
    const schema: ReferenceObject = {
      $ref: "#/components/schemas/User",
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(
      `"export type Test = User;"`
    );
  });

  it("should resolve ref (with custom prefix)", () => {
    const schema: ReferenceObject = {
      $ref: "#/components/schemas/User",
    };

    expect(printSchema(schema, "parameters")).toMatchInlineSnapshot(
      `"export type Test = Schemas.User;"`
    );
  });

  it("should generate a free form object (1)", () => {
    const schema: SchemaObject = {
      type: "object",
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(
      `"export type Test = Record<string, any>;"`
    );
  });

  it("should generate a free form object (2)", () => {
    const schema: SchemaObject = {
      type: "object",
      additionalProperties: true,
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          [key: string]: any;
      };"
    `);
  });

  it("should generate a free form object (3)", () => {
    const schema: SchemaObject = {
      type: "object",
      additionalProperties: {},
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          [key: string]: any;
      };"
    `);
  });

  it("should generate an object with additional properties", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "number" },
      },
      required: ["bar"],
      additionalProperties: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Foo",
        },
      },
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo?: string;
          bar: number;
      } & {
          [key: string]: Foo[];
      };"
    `);
  });

  it("should generate an object with additional properties as true", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "number" },
      },
      required: ["bar"],
      additionalProperties: true,
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo?: string;
          bar: number;
      } & {
          [key: string]: any;
      };"
    `);
  });

  it("should generate an object with additional properties as empty object", () => {
    const schema: SchemaObject = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "number" },
      },
      required: ["bar"],
      additionalProperties: {},
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo?: string;
          bar: number;
      } & {
          [key: string]: any;
      };"
    `);
  });

  it("should handle implicit object", () => {
    const schema: SchemaObject = {
      properties: {
        foo: { type: "string" },
        bar: { type: "number" },
      },
      required: ["bar"],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo?: string;
          bar: number;
      };"
    `);
  });

  it("should handle implicit array", () => {
    const schema: SchemaObject = {
      items: {
        $ref: "#/components/schemas/Foo",
      },
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(
      `"export type Test = Foo[];"`
    );
  });

  it("should generate void", () => {
    const schema: SchemaObject = {};

    expect(printSchema(schema)).toMatchInlineSnapshot(
      `"export type Test = void;"`
    );
  });

  it("should generate a oneOf", () => {
    const schema: SchemaObject = {
      oneOf: [{ type: "string" }, { type: "number" }],
    };

    expect(printSchema(schema)).toMatchInlineSnapshot(
      `"export type Test = string | number;"`
    );
  });

  describe("discrimination", () => {
    const schema: SchemaObject = {
      oneOf: [
        { $ref: "#/components/schemas/Foo" },
        { $ref: "#/components/schemas/Bar" },
        { $ref: "#/components/schemas/Baz" },
      ],
      discriminator: {
        propertyName: "discriminatorPropertyName",
        mapping: {
          foo: "#/components/schemas/Foo",
          bar: "#/components/schemas/Bar",
          baz: "#/components/schemas/Baz",
        },
      },
    };

    it("should omit the base value if present", () => {
      expect(
        printSchema(schema, "schemas", {
          schemas: {
            Foo: {
              type: "object",
              properties: {
                foo: { type: "string" },
                discriminatorPropertyName: { type: "string" },
              },
            },

            Bar: {
              type: "object",
              properties: {
                bar: { type: "string" },
                discriminatorPropertyName: { type: "string" },
              },
            },

            Baz: {
              type: "object",
              properties: {
                baz: { type: "string" },
                discriminatorPropertyName: { type: "string" },
              },
            },
          },
        })
      ).toMatchInlineSnapshot(`
        "export type Test = (Omit<Foo, \\"discriminatorPropertyName\\"> & {
            discriminatorPropertyName: \\"foo\\";
        }) | (Omit<Bar, \\"discriminatorPropertyName\\"> & {
            discriminatorPropertyName: \\"bar\\";
        }) | (Omit<Baz, \\"discriminatorPropertyName\\"> & {
            discriminatorPropertyName: \\"baz\\";
        });"
      `);
    });

    it("should not add the `Omit` if not necessary", () => {
      expect(
        printSchema(schema, "schemas", {
          schemas: {
            Foo: { type: "object", properties: { foo: { type: "string" } } },
            Bar: { type: "object", properties: { bar: { type: "string" } } },
            Baz: { type: "object", properties: { baz: { type: "string" } } },
          },
        })
      ).toMatchInlineSnapshot(`
        "export type Test = (Foo & {
            discriminatorPropertyName: \\"foo\\";
        }) | (Bar & {
            discriminatorPropertyName: \\"bar\\";
        }) | (Baz & {
            discriminatorPropertyName: \\"baz\\";
        });"
      `);
    });

    it("should use the original type if compliant", () => {
      expect(
        printSchema(schema, "schemas", {
          schemas: {
            Foo: {
              type: "object",
              properties: {
                foo: { type: "string" },
                discriminatorPropertyName: { type: "string", enum: ["foo"] },
              },

              required: ["discriminatorPropertyName"],
            },

            Bar: {
              type: "object",
              properties: {
                bar: { type: "string" },
                discriminatorPropertyName: { type: "string", enum: ["bar"] },
              },

              required: ["discriminatorPropertyName"],
            },

            Baz: {
              type: "object",
              properties: {
                baz: { type: "string" },
                discriminatorPropertyName: { type: "string", enum: ["baz"] },
              },

              required: ["discriminatorPropertyName"],
            },
          },
        })
      ).toMatchInlineSnapshot(`"export type Test = Foo | Bar | Baz;"`);
    });
  });

  describe("allOf", () => {
    it("should combine properties and allOf", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { foo: { type: "string" } } },
          { type: "object", properties: { bar: { type: "number" } } },
        ],
        properties: {
          foobar: { type: "string" },
        },
        required: ["foo", "foobar"],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo: string;
          bar?: number;
          foobar: string;
      };"
    `);
    });

    it("should combine additionalProperties and allOf", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { foo: { type: "string" } } },
          { type: "object", properties: { bar: { type: "number" } } },
        ],
        additionalProperties: {
          type: "string",
        },
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo?: string;
          bar?: number;
      } & {
          [key: string]: string;
      };"
    `);
    });

    it("should combine properties & additionalProperties & allOf", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { foo: { type: "string" } } },
          { type: "object", properties: { bar: { type: "number" } } },
        ],
        additionalProperties: {
          type: "string",
        },
        properties: {
          foobar: { type: "string" },
        },
        required: ["bar", "foobar"],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo?: string;
          bar: number;
          foobar: string;
      } & {
          [key: string]: string;
      };"
    `);
    });

    it("should combine nullable & allOf", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { foo: { type: "string" } } },
          { type: "object", properties: { bar: { type: "number" } } },
        ],
        nullable: true,
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
      "export type Test = {
          foo?: string;
          bar?: number;
      } | null;"
    `);
    });

    it("should combine inline types", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { foo: { type: "string" } } },
          { type: "object", properties: { bar: { type: "number" } } },
        ],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
        "export type Test = {
            foo?: string;
            bar?: number;
        };"
      `);
    });

    it("should combine ref and inline type", () => {
      const schema: SchemaObject = {
        allOf: [
          { $ref: "#/components/schemas/Foo" },
          { type: "object", properties: { bar: { type: "number" } } },
        ],
      };

      const components: OpenAPIObject["components"] = {
        schemas: {
          Foo: {
            type: "object",
            properties: {
              foo: { type: "string" },
            },
          },
        },
      };

      expect(printSchema(schema, undefined, components)).toMatchInlineSnapshot(`
        "export type Test = Foo & {
            bar?: number;
        };"
      `);
    });

    it("should generate a new type when schemas intersect", () => {
      const schema: SchemaObject = {
        allOf: [{ $ref: "#/components/schemas/Foo" }, { required: ["bar"] }],
      };

      const components: OpenAPIObject["components"] = {
        schemas: {
          Foo: {
            type: "object",
            properties: {
              bar: { type: "string" },
            },
          },
        },
      };

      expect(printSchema(schema, undefined, components)).toMatchInlineSnapshot(`
        "export type Test = {
            bar: string;
        };"
      `);
    });

    it("should generate a `never` if the combined type is broken", () => {
      const schema: SchemaObject = {
        allOf: [{ type: "string" }, { type: "number" }],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(
        `"export type Test = never;"`
      );
    });

    it("should generate a `never` if the combined property type is broken", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { foo: { type: "string" } } },
          { type: "object", properties: { foo: { type: "number" } } },
        ],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
        "export type Test = {
            foo?: never;
        };"
      `);
    });

    it("should generate documentation (object properties)", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { foo: { type: "string" } } },
          {
            type: "object",
            properties: { foo: { description: "A nice description for foo" } },
          },
          { description: "A nice top-level description" },
        ],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
        "/**
         * A nice top-level description
         */
        export type Test = {
            /**
             * A nice description for foo
             */
            foo?: string;
        };"
      `);
    });

    it("should generate documentation (top level)", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "string" },
          {
            type: "string",
            maxLength: 255,
          },
          { description: "A nice top-level description" },
        ],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
        "/**
         * A nice top-level description
         * 
         * @maxLength 255
         */
        export type Test = string;"
      `);
    });
  }); // end of allOf

  describe("anyOf", () => {
    it("should generate a simple union", () => {
      const schema: SchemaObject = {
        anyOf: [{ type: "string" }, { type: "number" }],
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(
        `"export type Test = string | number;"`
      );
    });

    it("should combine required & properties", () => {
      // from github api - operationId: gists/update
      const schema: SchemaObject = {
        anyOf: [
          {
            required: ["description"],
          },
          {
            required: ["files"],
          },
        ],
        nullable: true,
        properties: {
          description: {
            description: "Description of the gist",
            example: "Example Ruby script",
            type: "string",
          },
          files: {
            additionalProperties: {
              anyOf: [
                {
                  required: ["content"],
                },
                {
                  required: ["filename"],
                },
                {
                  maxProperties: 0,
                  type: "object",
                },
              ],
              nullable: true,
              properties: {
                content: {
                  description: "The new content of the file",
                  type: "string",
                },
                filename: {
                  description: "The new filename for the file",
                  nullable: true,
                  type: "string",
                },
              },
              type: "object",
            },
            description: "Names of files to be updated",
            example: {
              "hello.rb": {
                content: "blah",
                filename: "goodbye.rb",
              },
            },
            type: "object",
          },
        },
        type: "object",
      };

      expect(printSchema(schema)).toMatchInlineSnapshot(`
        "export type Test = {
            /**
             * Description of the gist
             *
             * @example Example Ruby script
             */
            description: string;
            /**
             * Names of files to be updated
             *
             * @example {\\"hello.rb\\":{\\"content\\":\\"blah\\",\\"filename\\":\\"goodbye.rb\\"}}
             */
            files?: {
                [key: string]: {
                    /**
                     * The new content of the file
                     */
                    content: string;
                    /**
                     * The new filename for the file
                     */
                    filename?: string | null;
                } | {
                    /**
                     * The new content of the file
                     */
                    content?: string;
                    /**
                     * The new filename for the file
                     */
                    filename: string | null;
                } | {} | null;
            };
        } | {
            /**
             * Description of the gist
             *
             * @example Example Ruby script
             */
            description?: string;
            /**
             * Names of files to be updated
             *
             * @example {\\"hello.rb\\":{\\"content\\":\\"blah\\",\\"filename\\":\\"goodbye.rb\\"}}
             */
            files: {
                [key: string]: {
                    /**
                     * The new content of the file
                     */
                    content: string;
                    /**
                     * The new filename for the file
                     */
                    filename?: string | null;
                } | {
                    /**
                     * The new content of the file
                     */
                    content?: string;
                    /**
                     * The new filename for the file
                     */
                    filename: string | null;
                } | {} | null;
            };
        } | null;"
      `);
    });
  });
});

const printSchema = (
  schema: SchemaObject,
  currentComponent: OpenAPIComponentType = "schemas",
  components?: OpenAPIObject["components"],
  useEnums?: boolean
) => {
  const nodes = schemaToTypeAliasDeclaration(
    "Test",
    schema,
    {
      currentComponent,
      openAPIDocument: { components },
    },
    useEnums
  );

  const sourceFile = ts.createSourceFile(
    "index.ts",
    "",
    ts.ScriptTarget.Latest
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  return nodes
    .map((node: ts.Node) =>
      printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
    )
    .join("\n");
};
