import { get, groupBy } from "lodash";
import {
  ComponentsObject,
  isReferenceObject,
  OperationObject,
  ParameterObject,
} from "openapi3-ts";

/**
 * Resolve $ref and group parameters by `type`.
 *
 * @param parameters Operation parameters
 * @param components #/components
 */
export const getParamsGroupByType = (
  parameters: OperationObject["parameters"] = [],
  components: ComponentsObject = {}
) => {
  const {
    query: queryParams = [] as ParameterObject[],
    path: pathParams = [] as ParameterObject[],
    header: headerParams = [] as ParameterObject[],
  } = groupBy(
    [...parameters].map<ParameterObject>((p) => {
      if (isReferenceObject(p)) {
        const schema = get(
          components,
          p.$ref.replace("#/components/", "").split("/")
        );
        if (!schema) {
          throw new Error(`${p.$ref} not found!`);
        }
        return schema;
      } else {
        return p;
      }
    }),
    "in"
  );

  return { queryParams, pathParams, headerParams };
};
