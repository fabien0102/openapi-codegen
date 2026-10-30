import { OpenAPIObject } from "openapi3-ts/oas30";

import type { OpenAPISourceFile } from "../types/index.js";

import swagger2openapi from "swagger2openapi";

/**
 * Parse an openAPI source file to an openAPI object.
 *
 * This method will convert legacy swagger 2 specs to openapi 3.0
 *
 * @param text raw data of the spec
 * @param format format of the spec
 */
export const parseOpenAPISourceFile = async ({
  text,
  format,
}: OpenAPISourceFile): Promise<OpenAPIObject> => {
  const YAML = await import("js-yaml");
  const schema = format === "yaml" ? YAML.load(text) : JSON.parse(text);

  return new Promise((resolve, reject) => {
    if (!schema.openapi || !schema.openapi.startsWith("3.0")) {
      swagger2openapi.convertObj(schema, {}, (err, convertedObj) => {
        if (err) {
          reject(err);
        } else {
          resolve(convertedObj.openapi);
        }
      });
    } else {
      resolve(schema);
    }
  });
};
