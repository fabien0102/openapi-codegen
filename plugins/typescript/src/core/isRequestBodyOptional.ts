import { get } from "lodash";
import {
  ComponentsObject,
  isReferenceObject,
  MediaTypeObject,
  OperationObject,
  ReferenceObject,
  RequestBodyObject,
} from "openapi3-ts";
import { findCompatibleMediaType } from "./findCompatibleMediaType";
import { getReferenceSchema } from "./getReferenceSchema";

/**
 * Check if all the properties are optionals
 */
export const isRequestBodyOptional = ({
  requestBody,
  components,
}: {
  requestBody?: OperationObject["requestBody"];
  components?: ComponentsObject;
}): boolean => {
  if (!requestBody) {
    return true;
  }

  let mediaType: MediaTypeObject | undefined = undefined;

  if (isReferenceObject(requestBody)) {
    const [hash, topLevel, namespace, _name] = requestBody.$ref.split("/");
    if (hash !== "#" || topLevel !== "components") {
      throw new Error(
        "This library only resolve $ref that are include into `#/components/*` for now"
      );
    }
    if (namespace !== "requestBodies") {
      throw new Error(
        "$ref for requestBody must be on `#/components/requestBodies`"
      );
    }

    const schema: RequestBodyObject | ReferenceObject = get(
      components,
      requestBody.$ref.replace("#/components/", "").split("/")
    );

    if (!schema) {
      throw new Error(`${requestBody.$ref} not found!`);
    }

    if (isReferenceObject(schema)) {
      return isRequestBodyOptional({ requestBody: schema, components });
    }

    mediaType = findCompatibleMediaType(schema);
  } else {
    mediaType = findCompatibleMediaType(requestBody);
  }

  if (!mediaType || !mediaType.schema) {
    return true;
  }

  if (isReferenceObject(mediaType.schema)) {
    const schema = getReferenceSchema(mediaType.schema.$ref, { components });

    return !schema.required;
  }

  return !mediaType.schema.required;
};
