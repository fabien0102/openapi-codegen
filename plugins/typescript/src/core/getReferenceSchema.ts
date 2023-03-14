import { get } from "lodash";
import {
  isReferenceObject,
  isSchemaObject,
  OpenAPIObject,
  SchemaObject,
} from "openapi3-ts";

/**
 * Get the SchemaObject from a $ref.
 *
 * @param $ref Path of the reference
 * @param context Context
 * @returns The resolved SchemaObject
 */
export const getReferenceSchema = (
  $ref: string,
  openAPIDocument: Pick<OpenAPIObject, "components">
): SchemaObject => {
  const [hash, ...refPath] = $ref.split("/");
  if (hash !== "#") {
    throw new Error("This library only resolve local $ref");
  }

  // NOTE: this is a fix for schema names that have '.' characters in them
  // if passed directly to lodash.get they are treated as path traversals instead of a literal schema name

  // get the last element of the refPath, [0] = 'components', [1] = 'schemas'
  const directSchemaName = refPath.at(-1);
  // try a direct access of the name from the schemas object
  const defaultDirectSearch = openAPIDocument.components?.schemas && openAPIDocument.components.schemas[directSchemaName!];

  // try to perform the typical ref path search but use the direct search as a fallback
  const referenceSchema = get(openAPIDocument, refPath.join("."), defaultDirectSearch);

  // if neither ref path nor direct search find the schema then throw that the ref cant be found
  if (!referenceSchema) {
    throw new Error(`${$ref} not found!`);
  }

  if (isReferenceObject(referenceSchema)) {
    return getReferenceSchema(referenceSchema.$ref, openAPIDocument);
  }

  if (!isSchemaObject(referenceSchema)) {
    throw new Error(`${$ref} can’t be resolved`);
  }

  return referenceSchema;
};
