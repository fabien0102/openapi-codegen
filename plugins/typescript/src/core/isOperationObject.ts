import { OperationObject } from "openapi3-ts";

/**
 * Type guard for `OperationObject`
 *
 * @param obj
 */
export const isOperationObject = (
  obj: unknown
): obj is OperationObject & { operationId: string } =>
  typeof obj === "object" &&
  obj !== null &&
  "operationId" in obj &&
  typeof obj.operationId === "string";
