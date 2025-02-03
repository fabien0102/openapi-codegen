import ts, { factory as f } from "typescript";
import {
  ComponentsObject,
  isReferenceObject,
  ReferenceObject,
  RequestBodyObject,
} from "openapi3-ts";
import { pascal } from "case";

import { findCompatibleMediaType } from "./findCompatibleMediaType";
import { getType } from "./schemaToTypeAliasDeclaration";

/**
 * Extract types from request body
 */
export const getRequestBodyType = ({
  requestBody,
  components,
}: {
  requestBody?: RequestBodyObject | ReferenceObject;
  components?: ComponentsObject;
}) => {
  if (!requestBody) {
    return f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
  }

  if (isReferenceObject(requestBody)) {
    const [hash, topLevel, namespace, name] = requestBody.$ref.split("/");
    if (hash !== "#" || topLevel !== "components") {
      throw new Error(
        "This library only resolve $ref that are include into `#/components/*` for now"
      );
    }
    if (namespace !== "requestBodies") {
      throw new Error(
        "$ref for requestBody must be on `#/components/requestBodies`"
      );
    }
    return f.createTypeReferenceNode(
      f.createQualifiedName(
        f.createIdentifier("RequestBodies"),
        f.createIdentifier(pascal(name))
      ),
      undefined
    );
  }

  const mediaType = findCompatibleMediaType(requestBody);
  if (!mediaType) {
    return f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
  }

  if (isReferenceObject(mediaType)) {
    const [hash, topLevel, namespace, name] = mediaType.$ref.split("/");
    if (hash !== "#" || topLevel !== "components") {
      throw new Error(
        "This library only resolve $ref that are include into `#/components/*` for now"
      );
    }
    if (namespace !== "schemas") {
      throw new Error("$ref for schemas must be on `#/components/schemas`");
    }

    return f.createTypeReferenceNode(
      f.createQualifiedName(
        f.createIdentifier("Schemas"),
        f.createIdentifier(pascal(name))
      ),
      undefined
    );
  }

  if (!mediaType.schema) {
    return f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
  }

  return getType(mediaType.schema, {
    currentComponent: null,
    openAPIDocument: { components },
  });
};
