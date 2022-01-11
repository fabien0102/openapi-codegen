import { camel } from "case";
import { ParameterObject, SchemaObject } from "openapi3-ts";

/**
 * Convert a list of params in an object schema.
 *
 * @param params Parameters list
 * @param optionalKeys Override the key to be optional
 * @returns An openAPI object schemas with the parameters as properties
 */
export const paramsToSchema = (
  params: ParameterObject[],
  optionalKeys: string[] = []
): SchemaObject => {
  return {
    type: "object",
    properties: params.reduce((mem, param) => {
      return {
        ...mem,
        [camel(param.name)]: {
          ...param.schema,
          description: param.description,
        },
      };
    }, {}),
    required: params
      .filter((p) => p.required && !optionalKeys.includes(camel(p.name)))
      .map((p) => camel(p.name)),
  };
};
