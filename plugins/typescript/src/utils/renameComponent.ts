import { get, set, unset } from "lodash";
import { OpenAPIObject } from "openapi3-ts";

/**
 * Util to rename an openAPI component name
 */
export const renameComponent = ({
  openAPIDocument,
  from,
  to,
}: {
  /**
   * The openAPI document to transform
   */
  openAPIDocument: OpenAPIObject;
  /**
   * Original component path (eg: `#/components/schemas/Foo`)
   */
  from: string;
  /**
   * Renamed component path (eg: `#/components/schemas/Bar`)
   */
  to: string;
}): OpenAPIObject => {
  const renamedOpenAPIDocument: OpenAPIObject = JSON.parse(
    JSON.stringify(openAPIDocument).replace(
      new RegExp(`"${from}"`, "g"),
      `"${to}"`
    )
  );

  const fromPath = from.slice("#/".length).replace(/\//g, ".");
  const toPath = to.slice("#/".length).replace(/\//g, ".");

  const schema = get(openAPIDocument, fromPath);
  set(renamedOpenAPIDocument, toPath, schema);
  unset(renamedOpenAPIDocument, fromPath);

  return renamedOpenAPIDocument;
};
