import { camel } from "case";

/**
 * Transform url params case to camel.
 *
 * @example
 * `pet/{pet_id}` -> `pet/{petId}`
 */
export const camelizedPathParams = (url: string) =>
  url.replace(/\{[\w\d\-_.]*\}/g, (match) => `{${camel(match)}}`);
