import ts, { factory as f } from "typescript";
import {
  ComponentsObject,
  isReferenceObject,
  ReferenceObject,
  ResponseObject,
  ResponsesObject,
} from "openapi3-ts";
import { uniqBy } from "lodash";
import { pascal } from "case";

import { findCompatibleMediaType } from "./findCompatibleMediaType";
import { getType } from "./schemaToTypeAliasDeclaration";

/**
 * Extract types from success responses (2xx)
 */
export const getDataResponseType = ({
  responses,
  components,
  printNodes,
}: {
  responses: ResponsesObject;
  components?: ComponentsObject;
  printNodes: (nodes: ts.Node[]) => string;
}) => {
  const responseTypes = uniqBy(
    Object.entries(responses).reduce(
      (
        mem,
        [statusCode, response]: [string, ResponseObject | ReferenceObject]
      ) => {
        if (!statusCode.startsWith("2")) return mem;
        if (isReferenceObject(response)) {
          const [hash, topLevel, namespace, name] = response.$ref.split("/");
          if (hash !== "#" || topLevel !== "components") {
            throw new Error(
              "This library only resolve $ref that are include into `#/components/*` for now"
            );
          }
          if (namespace !== "responses") {
            throw new Error(
              "$ref for responses must be on `#/components/responses`"
            );
          }
          return [
            ...mem,
            f.createTypeReferenceNode(
              f.createQualifiedName(
                f.createIdentifier("Responses"),
                f.createIdentifier(pascal(name))
              ),
              undefined
            ),
          ];
        }

        const mediaType = findCompatibleMediaType(response);
        if (!mediaType || !mediaType.schema) return mem;

        return [
          ...mem,
          getType(mediaType.schema, {
            currentComponent: null,
            openAPIDocument: { components },
          }),
        ];
      },
      [] as ts.TypeNode[]
    ),
    (node) => printNodes([node])
  );

  return responseTypes.length === 0
    ? f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
    : responseTypes.length === 1
    ? responseTypes[0]
    : f.createUnionTypeNode(responseTypes);
};
