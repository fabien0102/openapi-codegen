declare module "swagger2openapi" {
  import { OpenAPIObject } from "openapi3-ts";
  interface ConverObjCallbackData {
    openapi: OpenAPIObject;
  }
  function convertObj(
    schema: unknown,
    options: Record<string, never>,
    callback: (err: Error, data: ConverObjCallbackData) => void,
  ): void;
}
