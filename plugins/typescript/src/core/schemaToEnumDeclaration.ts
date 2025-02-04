import { pascal } from "case";
import { SchemaObject } from "openapi3-ts";
import ts, { factory as f } from "typescript";
import { convertNumberToWord } from "../utils/getEnumProperties";
import { Context, getJSDocComment } from "./schemaToTypeAliasDeclaration";

/**
 * Function to check if a string is a valid TypeScript identifier
 *
 * @param name Name to check
 */
function isValidIdentifier(name: string): boolean {
  if (name.length === 0) {
    return false;
  }

  const firstChar = name.charCodeAt(0);
  if (!ts.isIdentifierStart(firstChar, ts.ScriptTarget.Latest)) {
    return false;
  }

  for (let i = 1; i < name.length; i++) {
    if (!ts.isIdentifierPart(name.charCodeAt(i), ts.ScriptTarget.Latest)) {
      return false;
    }
  }

  return true;
}

/**
 * Add Enum support when transforming an OpenAPI Schema Object to Typescript Nodes.
 *
 * @param name Name of the schema
 * @param schema OpenAPI Schema object
 * @param context Context
 */
export const schemaToEnumDeclaration = (
  name: string,
  schema: SchemaObject,
  context: Context
): ts.Node[] => {
  const jsDocNode = getJSDocComment(schema, context);
  const members = getEnumMembers(schema);
  const declarationNode = f.createEnumDeclaration(
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    pascal(name),
    members
  );

  return jsDocNode ? [jsDocNode, declarationNode] : [declarationNode];
};

function getEnumMembers(schema: SchemaObject): ts.EnumMember[] {
  if (!schema.enum || !Array.isArray(schema.enum)) {
    throw new Error(
      "The provided schema does not have an 'enum' property or it is not an array."
    );
  }

  return schema.enum.map((enumValue) => {
    let enumName: string;
    let enumValueNode: ts.Expression | undefined = undefined;

    if (typeof enumValue === "string") {
      enumName = enumValue;
      enumValueNode = f.createStringLiteral(enumValue);
    } else if (typeof enumValue === "number") {
      enumName = convertNumberToWord(enumValue)
        .toUpperCase()
        .replace(/[-\s]/g, "_");
      enumValueNode = f.createNumericLiteral(enumValue);
    } else if (typeof enumValue === "boolean") {
      enumName = enumValue ? "True" : "False";
    } else {
      throw new Error(`Unsupported enum value type: ${typeof enumValue}`);
    }

    enumName = pascal(enumName);
    return f.createEnumMember(
      isValidIdentifier(enumName)
        ? f.createIdentifier(enumName)
        : f.createStringLiteral(`${enumValue}`),
      enumValueNode
    );
  });
}
