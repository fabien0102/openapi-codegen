import { mapValues } from "lodash";
import { OpenAPIObject, PathItemObject } from "openapi3-ts";

/**
 * Util to rename an openAPI component name
 */
export const addPathParam = ({
  openAPIDocument,
  pathParam,
  isRequired = false,
  filter = () => true,
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
   * @default false
   */
  isRequired?: boolean;
  filter?: (key: string, pathParam: PathItemObject) => boolean;
}): OpenAPIObject => {
  return {
    ...openAPIDocument,
    paths: mapValues(
      openAPIDocument.paths,
      (value: PathItemObject, key: string) => ({
        ...value,
        parameters: filter(key, value)
          ? [
              ...(value.parameters ?? []),
              {
                name: pathParam,
                in: "path",
                required: isRequired,
                schema: { type: "string" },
              },
            ]
          : value.parameters,
      })
    ),
  };
};
