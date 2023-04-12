import { pascal } from "case";
import { SchemaObject } from "openapi3-ts";

/**
 * Extracts all the properties with enum values from an array of schema objects.
 * @param schemaArray An array of OpenAPI schema objects
 * @returns A tuple array containing the property names with enum values and their corresponding schema objects
 */
export const getEnumProperties = (
  schemaArray: SchemaObject[]
): [string, SchemaObject][] => {
  const enumProperties: [string, SchemaObject][] = [];

  schemaArray.forEach((schemaObj) => {
    const name = schemaObj[0];
    const schema = schemaObj[1];

    if (schema.enum) {
      enumProperties.push([name, schema]);
    } else if (schema.type === "object" && schema.properties) {
      Object.entries(schema.properties).forEach(
        ([propertyName, propertySchema]) => {
          processProperty(
            enumProperties,
            `${name}${pascal(propertyName)}`,
            propertySchema
          );
        }
      );
    }
  });

  return enumProperties;
};

const processProperty = (
  enumProperties: [string, SchemaObject][],
  propertyName: string,
  propertySchema: any
) => {
  if (propertySchema.enum) {
    enumProperties.push([`${pascal(propertyName)}`, propertySchema]);
  } else if (propertySchema.type === "object" && propertySchema.properties) {
    Object.entries(propertySchema.properties).forEach(
      ([nestedPropertyName, nestedPropertySchema]) => {
        processProperty(
          enumProperties,
          `${propertyName}${pascal(nestedPropertyName)}`,
          nestedPropertySchema
        );
      }
    );
  }
};

const ones: string[] = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const tens: string[] = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

export const convertNumberToWord = (n: number): string => {
  if (n < 20) {
    return ones[n];
  }

  const digit = n % 10;

  if (n < 100) {
    return tens[Math.floor(n / 10)] + (digit ? "-" + ones[digit] : "");
  }

  if (n < 1000) {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    return (
      ones[hundred] +
      " hundred" +
      (remainder ? " " + convertNumberToWord(remainder) : "")
    );
  }

  const thousand = Math.floor(n / 1000);
  const remainder = n % 1000;

  return (
    convertNumberToWord(thousand) +
    " thousand" +
    (remainder ? " " + convertNumberToWord(remainder) : "")
  );
};
