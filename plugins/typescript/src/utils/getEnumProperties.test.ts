import { SchemaObject } from "openapi3-ts";
import { convertNumberToWord, getEnumProperties } from "./getEnumProperties";

describe("getEnumProperties", () => {
  it("should return an empty array when input schema array is empty", () => {
    const result = getEnumProperties([]);
    expect(result).toMatchInlineSnapshot(`Array []`);
  });

  it("should correctly extract root enum properties", () => {
    const mockRootEnumSchema: [string, SchemaObject][] = [
      [
        "MyUserStatus",
        {
          type: "string",
          enum: ["ENABLED", "DISABLED"],
        },
      ],
    ];

    const result = getEnumProperties(mockRootEnumSchema);
    expect(result).toMatchInlineSnapshot(`
      Array [
        Array [
          "MyUserStatus",
          Object {
            "enum": Array [
              "ENABLED",
              "DISABLED",
            ],
            "type": "string",
          },
        ],
      ]
    `);
  });

  it("should correctly extract nested enum properties", () => {
    const mockSchemaWithNestedEnums: [string, SchemaObject][] = [
      [
        "Pet",
        {
          required: ["name", "photoUrls"],
          type: "object",
          properties: {
            id: {
              type: "integer",
              format: "int64",
              example: 10,
            },
            name: {
              type: "string",
              example: "doggie",
            },
            category: {
              $ref: "#/components/schemas/Category",
            },
            photoUrls: {
              type: "array",
              xml: {
                wrapped: true,
              },
              items: {
                type: "string",
                xml: {
                  name: "photoUrl",
                },
              },
            },
            tags: {
              type: "array",
              xml: {
                wrapped: true,
              },
              items: {
                $ref: "#/components/schemas/Tag",
              },
            },
            status: {
              type: "string",
              description: "pet status in the store",
              enum: ["AVAILABLE", "PENDING", "SOLD"],
            },
          },
          xml: {
            name: "pet",
          },
        },
      ],
    ];

    const result = getEnumProperties(mockSchemaWithNestedEnums);
    expect(result).toMatchInlineSnapshot(`
      Array [
        Array [
          "PetStatus",
          Object {
            "description": "pet status in the store",
            "enum": Array [
              "AVAILABLE",
              "PENDING",
              "SOLD",
            ],
            "type": "string",
          },
        ],
      ]
    `);
  });
});

describe("convertNumberToWord", () => {
  const testCases: Array<[number, string]> = [
    [0, "zero"],
    [7, "seven"],
    [15, "fifteen"],
    [27, "twenty-seven"],
    [42, "forty-two"],
    [99, "ninety-nine"],
    [100, "one hundred"],
    [110, "one hundred ten"],
    [134, "one hundred thirty-four"],
    [201, "two hundred one"],
    [999, "nine hundred ninety-nine"],
    [1000, "one thousand"],
    [1234, "one thousand two hundred thirty-four"],
    [3456, "three thousand four hundred fifty-six"],
    [9999, "nine thousand nine hundred ninety-nine"],
  ];

  testCases.forEach(([input, expected]) => {
    it(`should convert ${input} to '${expected}'`, () => {
      expect(convertNumberToWord(input)).toBe(expected);
    });
  });
});
