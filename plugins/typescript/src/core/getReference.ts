import { get } from "lodash";
import {
  ComponentsObject,
  isReferenceObject,
  ReferenceObject,
} from "openapi3-ts/oas30";

/**
 * Get a reference.
 *
 * @param $ref Path of the reference
 * @param components Root components object
 */
function getReference<Type extends keyof ComponentsObject>(type: Type) {
  return function (
    $ref: ReferenceObject["$ref"],
    components: ComponentsObject = {}
  ): Exclude<Required<ComponentsObject>[Type][number], ReferenceObject> {
    const [hash, topLevel, namespace] = $ref.split("/");
    if (hash !== "#" || topLevel !== "components") {
      throw new Error(
        "This library only resolve $ref that are include into `#/components/*` for now"
      );
    }
    if (namespace !== type) {
      throw new Error(`$ref for ${type} must be on "#/components/${type}"`);
    }

    const schema: Required<ComponentsObject>[Type][number] = get(
      components,
      $ref.replace("#/components/", "").split("/")
    );

    if (!schema) {
      throw new Error(`${$ref} not found!`);
    }

    if (isReferenceObject(schema))
      return getReference(type)(schema.$ref, components);

    return schema;
  };
}

/**
 * Get the SchemaObject from a $ref.
 *
 * @param $ref Path of the reference
 * @param components Root components object
 * @returns The resolved SchemaObject
 */
export const getReferenceSchema = getReference("schemas");
