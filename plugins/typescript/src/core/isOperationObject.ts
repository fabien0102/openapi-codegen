import { OperationObject } from "openapi3-ts";

/**
 * Type guard for `OperationObject`
 *
 * @param obj
 */
export const isOperationObject = (
  obj: any
): obj is OperationObject & { operationId: string } =>
  typeof obj === "object" && typeof (obj as any).operationId === "string";
