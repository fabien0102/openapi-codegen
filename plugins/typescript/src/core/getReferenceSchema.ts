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
  const referenceSchema = get(openAPIDocument, refPath.join("."));

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
