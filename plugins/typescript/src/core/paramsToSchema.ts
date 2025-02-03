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
  const formatKey = params[0].in === "path" ? camel : (key: string) => key;
  return {
    type: "object",
    properties: params.reduce((mem, param) => {
      return {
        ...mem,
        [formatKey(param.name)]: {
          ...param.schema,
          description: param.description,
        },
      };
    }, {}),
    required: params
      .filter((p) => p.required && !optionalKeys.includes(formatKey(p.name)))
      .map((p) => formatKey(p.name)),
  };
};
