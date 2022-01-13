import { cloneDeep, set } from "lodash";
import { OpenAPIObject, PathItemObject } from "openapi3-ts";

import { isOperationObject } from "../core/isOperationObject";
import { isVerb } from "../core/isVerb";

export const forceReactQueryComponent = <OperationId extends string>({
  openAPIDocument,
  operationId,
  component,
}: {
  /**
   * The openAPI document to transform
   */
  openAPIDocument: OpenAPIObject;
  /**
   * OperationId to force
   */
  operationId: OperationId;
  /**
   * Component to use
   */
  component: "useMutate" | "useQuery";
}) => {
  let extensionPath: string | undefined;

  // Find the component
  Object.entries(openAPIDocument.paths).forEach(
    ([route, verbs]: [string, PathItemObject]) => {
      Object.entries(verbs).forEach(([verb, operation]) => {
        if (!isVerb(verb) || !isOperationObject(operation)) return;
        if (operation.operationId === operationId) {
          extensionPath = `paths.${route}.${verb}.x-openapi-codegen-component`;
        }
      });
    }
  );

  if (!extensionPath) {
    throw new Error(
      `[forceReactQueryComponent] Operation with the operationId "${operationId}" not found`
    );
  }

  return set(cloneDeep(openAPIDocument), extensionPath, component);
};
