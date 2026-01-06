import { pascal } from "case";
import {
  isReferenceObject,
  ReferenceObject,
  SchemaObject,
} from "openapi3-ts/oas30";

/**
 * Extracts all the properties with enum values from an array of schema objects.
 * @param componentSchemaEntries An array of OpenAPI schema objects
 * @returns A tuple array containing the property names with enum values and their corresponding schema objects
 */
export const getEnumProperties = (
  componentSchemaEntries: [string, SchemaObject | ReferenceObject][]
): [string, SchemaObject][] => {
  const enumProperties: [string, SchemaObject][] = [];

  componentSchemaEntries.forEach(([name, schema]) => {
    if (isReferenceObject(schema)) return;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  if (n < 0) {
    return "minus " + convertNumberToWord(-n);
  }

  if (!Number.isInteger(n)) {
    const [intPart, fracPart] = n.toString().split(".");
    return (
      convertNumberToWord(Number(intPart)) +
      " point " +
      fracPart
        .split("")
        .map((digit) => ones[Number(digit)])
        .join(" ")
    );
  }

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
