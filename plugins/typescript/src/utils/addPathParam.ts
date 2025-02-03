import { mapValues } from "lodash";
import { OpenAPIObject, PathItemObject } from "openapi3-ts";

/**
 * Util to add a path param to an openAPI operation
 */
export const addPathParam = ({
  openAPIDocument,
  pathParam,
  required,
  condition: filter = () => true,
}: {
  /**
   * The openAPI document to transform
   */
  openAPIDocument: OpenAPIObject;
  /**
   * Path param to inject in all requests
   */
  pathParam: string;
  /**
   * If the path param is required
   */
  required: boolean;
  /**
   * Condition to include/exclude the path param
   */
  condition?: (key: string, pathParam: PathItemObject) => boolean;
}): OpenAPIObject => {
  return {
    ...openAPIDocument,
    paths: mapValues(
      openAPIDocument.paths,
      (value: PathItemObject, key: string) =>
        filter(key, value)
          ? {
              ...value,
              parameters: [
                ...(value.parameters ?? []),
                {
                  name: pathParam,
                  in: "path",
                  required,
                  schema: { type: "string" },
                },
              ],
            }
          : value
    ),
  };
};
