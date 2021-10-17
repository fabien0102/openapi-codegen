import { findKey, get } from "lodash";
import {
  ComponentsObject,
  DiscriminatorObject,
  isReferenceObject,
  isSchemaObject,
  OpenAPIObject,
  ReferenceObject,
  SchemaObject,
} from "openapi3-ts";
import ts, { factory as f } from "typescript";

type RemoveIndex<T> = {
  [P in keyof T as string extends P
    ? never
    : number extends P
    ? never
    : P]: T[P];
};

type GeneratedComponents = Extract<
  keyof RemoveIndex<ComponentsObject>,
  "parameters" | "responses" | "schemas" | "requestBodies"
>;

export type RefPrefixes = Record<GeneratedComponents, string>;

export type Context = {
  specs: Pick<OpenAPIObject, "components">;
  refPrefixes: RefPrefixes;
};

/**
 * Transform an OpenAPI Schema Object to Typescript Nodes (comment & declaration).
 *
 * @param name  Name of the schema
 * @param schema OpenAPI Schema object
 * @param context Context
 */
export const schemaToTypeAliasDeclaration = (
  name: string,
  schema: SchemaObject,
  context: Context
): ts.Node[] => {
  const jsDocNode = getJSDocComment(schema);
  const declarationNode = f.createTypeAliasDeclaration(
    undefined,
    [f.createModifier(ts.SyntaxKind.ExportKeyword)],
    name,
    undefined,
    getType(schema, context)
  );

  return jsDocNode ? [jsDocNode, declarationNode] : [declarationNode];
};

/**
 * Get the type.
 *
 * @param schema OpenAPI Schema
 * @returns ts.TypeNode
 */
const getType = (
  schema: SchemaObject | ReferenceObject,
  context: Context
): ts.TypeNode => {
  if (isReferenceObject(schema)) {
    const [hash, topLevel, namespace, name] = schema.$ref.split("/");
    if (hash !== "#" || topLevel !== "components") {
      throw new Error(
        "This library only resolve $ref that are include into `#/components/*` for now"
      );
    }
    if (namespace in context.refPrefixes) {
      return f.createTypeReferenceNode(
        f.createIdentifier(
          context.refPrefixes[namespace as keyof RefPrefixes] + name
        )
      );
    }
    return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  }

  if (schema.oneOf) {
    return f.createUnionTypeNode(
      schema.oneOf.map((i) =>
        withDiscriminator(getType(i, context), i, schema.discriminator, context)
      )
    );
  }

  if (schema.anyOf) {
    return f.createUnionTypeNode(
      schema.anyOf.map((i) =>
        withDiscriminator(getType(i, context), i, schema.discriminator, context)
      )
    );
  }

  if (schema.allOf) {
    return getAllOf(schema.allOf, context);
  }

  if (schema.enum) {
    return f.createUnionTypeNode(
      schema.enum.map((value) => {
        if (typeof value === "string") {
          return f.createLiteralTypeNode(f.createStringLiteral(value));
        }
        if (typeof value === "number") {
          return f.createLiteralTypeNode(f.createNumericLiteral(value));
        }
        if (typeof value === "boolean") {
          return f.createLiteralTypeNode(
            value ? f.createTrue() : f.createFalse()
          );
        }
        return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      })
    );
  }

  switch (schema.type) {
    case "null":
      return f.createLiteralTypeNode(f.createNull());
    case "integer":
    case "number":
      return withNullable(
        f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        schema.nullable
      );
    case "string":
      return withNullable(
        f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        schema.nullable
      );
    case "boolean":
      return withNullable(
        f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
        schema.nullable
      );
    case "object":
      if (!schema.properties /* free form object */) {
        return withNullable(
          f.createTypeReferenceNode(f.createIdentifier("Record"), [
            f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
          ]),
          schema.nullable
        );
      }

      const members: ts.TypeElement[] = Object.entries(schema.properties).map(
        ([key, property]) => {
          const propertyNode = f.createPropertySignature(
            undefined,
            f.createIdentifier(key),
            schema.required?.includes(key)
              ? undefined
              : f.createToken(ts.SyntaxKind.QuestionToken),
            getType(property, context)
          );
          const jsDocNode = getJSDocComment(property);
          if (jsDocNode) addJSDocToNode(propertyNode, jsDocNode);

          return propertyNode;
        }
      );

      const additionalPropertiesNode = getAdditionalProperties(schema, context);

      if (additionalPropertiesNode) members.push(additionalPropertiesNode);

      return withNullable(f.createTypeLiteralNode(members), schema.nullable);
    case "array":
      return withNullable(
        f.createArrayTypeNode(
          !schema.items
            ? f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            : getType(schema.items, context)
        ),
        schema.nullable
      );
    default:
      return withNullable(
        f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        schema.nullable
      );
  }
};

/**
 * Add nullable option if needed.
 *
 * @param node Any node
 * @param nullable Add nullable option if true
 * @returns Type with or without nullable option
 */
const withNullable = (
  node: ts.TypeNode,
  nullable: boolean | undefined
): ts.TypeNode => {
  return nullable
    ? f.createUnionTypeNode([node, f.createLiteralTypeNode(f.createNull())])
    : node;
};

/**
 * Combine the original type with the discriminator mapping value.
 *
 * @param node
 * @param discriminator
 * @returns
 */
const withDiscriminator = (
  node: ts.TypeNode,
  schema: SchemaObject | ReferenceObject,
  discriminator: DiscriminatorObject | undefined,
  context: Context
): ts.TypeNode => {
  if (!discriminator || !discriminator.propertyName || !discriminator.mapping) {
    return node;
  }

  const discriminatedValue = findKey(
    discriminator.mapping,
    (i) => i === schema.$ref
  );
  if (discriminatedValue) {
    const propertyNameAsLiteral = f.createTypeLiteralNode([
      f.createPropertySignature(
        undefined,
        f.createIdentifier(discriminator.propertyName),
        undefined,
        f.createLiteralTypeNode(f.createStringLiteral(discriminatedValue))
      ),
    ]);

    const spec = get<SchemaObject | ReferenceObject>(
      context.specs,
      schema.$ref.slice(2).replace(/\//g, ".")
    );
    if (spec && isSchemaObject(spec) && spec.properties) {
      const property = spec.properties[discriminator.propertyName];
      if (
        property &&
        isSchemaObject(property) &&
        property.enum?.length === 1 &&
        property.enum[0] === discriminatedValue &&
        spec.required?.includes(discriminator.propertyName)
      ) {
        return node;
      }
      if (!property) {
        return f.createIntersectionTypeNode([node, propertyNameAsLiteral]);
      }
    }

    const baseTypeWithoutPropertyName = f.createTypeReferenceNode(
      f.createIdentifier("Omit"),
      [
        node,
        f.createLiteralTypeNode(
          f.createStringLiteral(discriminator.propertyName)
        ),
      ]
    );

    return f.createIntersectionTypeNode([
      baseTypeWithoutPropertyName,
      propertyNameAsLiteral,
    ]);
  }

  return node;
};

/**
 * Get `allOf` type.
 */
const getAllOf = (
  members: Required<SchemaObject["allOf"]>,
  context: Context
): ts.TypeNode => {
  return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
};

const keysToExpressAsJsDocProperty: Array<keyof RemoveIndex<SchemaObject>> = [
  "minimum",
  "maximum",
  "default",
  "minLength",
  "maxLength",
  "format",
  "pattern",
  "example",
  "examples",
  "multipleOf",
  "exclusiveMaximum",
  "exclusiveMinimum",
  "maxLength",
  "maxItems",
  "minItems",
  "uniqueItems",
  "maxProperties",
  "minProperties",
  "deprecated",
];

/**
 * Get JSDocComment from an OpenAPI Schema.
 *
 * @param schema
 * @returns JSDoc node
 */
const getJSDocComment = (schema: SchemaObject): ts.JSDoc | undefined => {
  const propertyTags: ts.JSDocPropertyTag[] = [];
  Object.entries(schema)
    .filter(
      ([key, value]) =>
        keysToExpressAsJsDocProperty.includes(key as any) ||
        (/^x-/.exec(key) && typeof value !== "object")
    )
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) =>
          propertyTags.push(
            f.createJSDocPropertyTag(
              f.createIdentifier(key.slice(0, -1)), // Remove the plural
              f.createIdentifier(v.toString()),
              false
            )
          )
        );
      } else if (typeof value !== "undefined") {
        propertyTags.push(
          f.createJSDocPropertyTag(
            f.createIdentifier(key),
            f.createIdentifier(value.toString()),
            false
          )
        );
      }
    });

  if (schema.description || propertyTags.length > 0) {
    return f.createJSDocComment(
      schema.description
        ? schema.description.trim() + (propertyTags.length ? "\n" : "")
        : undefined,
      propertyTags
    );
  }
  return undefined;
};

/**
 * Add js comment to a node (mutate the original node).
 *
 * We need to do this because JSDoc are not part of Typescript AST.
 *
 * @param node
 * @param jsDocComment
 */
const addJSDocToNode = (node: ts.Node, jsDocComment: ts.JSDoc) => {
  const sourceFile = ts.createSourceFile(
    "index.ts",
    "",
    ts.ScriptTarget.Latest
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  const jsDocString = printer
    .printNode(ts.EmitHint.Unspecified, jsDocComment, sourceFile)
    .replace(/^( )*(\/\*)?\*?( *)/g, "") // Remove opening comment notations
    .replace("*/", ""); // Remove closing comment notation

  ts.addSyntheticLeadingComment(
    node,
    ts.SyntaxKind.MultiLineCommentTrivia,
    jsDocString,
    true
  );
};

/**
 * Get IndexSignatureDeclaration from `schema.additionalProperties`.
 *
 * @param schema
 * @param context
 * @returns Index signature node
 */
const getAdditionalProperties = (
  schema: SchemaObject,
  context: Context
): ts.IndexSignatureDeclaration | undefined => {
  if (!schema.additionalProperties) return undefined;

  return f.createIndexSignature(
    undefined,
    undefined,
    [
      f.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        f.createIdentifier("key"),
        undefined,
        f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      ),
    ],
    schema.additionalProperties === true ||
      Object.keys(schema.additionalProperties).length === 0
      ? f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      : getType(schema.additionalProperties, context)
  );
};
