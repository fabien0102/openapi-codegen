import ts, { factory as f } from "typescript";
import {
  ComponentsObject,
  isReferenceObject,
  ReferenceObject,
  ResponseObject,
  ResponsesObject,
} from "openapi3-ts";

import { findCompatibleMediaType } from "./findCompatibleMediaType";
import { getType } from "./schemaToTypeAliasDeclaration";
import { pascal } from "case";

export const clientErrorStatus = "ClientErrorStatus";
export const serverErrorStatus = "ServerErrorStatus";

/**
 * Extract types from error responses (4xx + 5xx)
 */
export const getErrorResponseType = ({
  responses,
  components,
  printNodes,
}: {
  responses: ResponsesObject;
  components?: ComponentsObject;
  printNodes: (nodes: ts.Node[]) => string;
}) => {
  const status = Object.keys(responses);

  const responseTypes = Object.entries(responses).reduce(
    (
      mem,
      [statusCode, response]: [string, ResponseObject | ReferenceObject]
    ) => {
      if (statusCode.startsWith("2")) return mem;
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
          createStatusDeclaration(
            statusCode,
            f.createTypeReferenceNode(
              f.createQualifiedName(
                f.createIdentifier("Responses"),
                f.createIdentifier(pascal(name))
              ),
              undefined
            ),
            status
          ),
        ];
      }

      const mediaType = findCompatibleMediaType(response);
      if (!mediaType || !mediaType.schema) return mem;

      return [
        ...mem,
        createStatusDeclaration(
          statusCode,
          getType(mediaType.schema, {
            currentComponent: null,
            openAPIDocument: { components },
          }),
          status
        ),
      ];
    },
    [] as ts.TypeNode[]
  );

  return f.createTypeReferenceNode("Fetcher.ErrorWrapper", [
    responseTypes.length === 0
      ? f.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
      : responseTypes.length === 1
      ? responseTypes[0]
      : f.createUnionTypeNode(responseTypes),
  ]);
};

const createStatusDeclaration = (
  statusCode: string,
  type: ts.TypeNode,
  status: string[]
): ts.TypeNode => {
  let statusType: ts.TypeNode = f.createLiteralTypeNode(
    f.createNumericLiteral(statusCode)
  );

  if (
    statusCode === "4xx" ||
    (statusCode === "default" && status.includes("5xx"))
  ) {
    const usedClientCode = status.filter(
      (s) => s.startsWith("4") && s !== "4xx"
    );
    if (usedClientCode.length > 0) {
      statusType = f.createTypeReferenceNode("Exclude", [
        f.createTypeReferenceNode(clientErrorStatus),
        usedClientCode.length === 1
          ? f.createLiteralTypeNode(f.createNumericLiteral(usedClientCode[0]))
          : f.createUnionTypeNode(
              usedClientCode.map((code) =>
                f.createLiteralTypeNode(f.createNumericLiteral(code))
              )
            ),
      ]);
    } else {
      statusType = f.createTypeReferenceNode(clientErrorStatus);
    }
  }

  if (
    statusCode === "5xx" ||
    (statusCode === "default" && status.includes("4xx"))
  ) {
    const usedServerCode = status.filter(
      (s) => s.startsWith("5") && s !== "5xx"
    );
    if (usedServerCode.length > 0) {
      statusType = f.createTypeReferenceNode("Exclude", [
        f.createTypeReferenceNode(serverErrorStatus),
        usedServerCode.length === 1
          ? f.createLiteralTypeNode(f.createNumericLiteral(usedServerCode[0]))
          : f.createUnionTypeNode(
              usedServerCode.map((code) =>
                f.createLiteralTypeNode(f.createNumericLiteral(code))
              )
            ),
      ]);
    } else {
      statusType = f.createTypeReferenceNode(serverErrorStatus);
    }
  }

  if (
    statusCode === "default" &&
    !status.includes("4xx") &&
    !status.includes("5xx")
  ) {
    const otherCodes = status.filter((s) => s !== "default");
    if (otherCodes.length > 0) {
      statusType = f.createTypeReferenceNode("Exclude", [
        f.createUnionTypeNode([
          f.createTypeReferenceNode(clientErrorStatus),
          f.createTypeReferenceNode(serverErrorStatus),
        ]),
        otherCodes.length === 1
          ? f.createLiteralTypeNode(f.createNumericLiteral(otherCodes[0]))
          : f.createUnionTypeNode(
              otherCodes.map((code) =>
                f.createLiteralTypeNode(f.createNumericLiteral(code))
              )
            ),
      ]);
    } else {
      statusType = f.createUnionTypeNode([
        f.createTypeReferenceNode(clientErrorStatus),
        f.createTypeReferenceNode(serverErrorStatus),
      ]);
    }
  }

  if (
    statusCode === "default" &&
    status.includes("4xx") &&
    status.includes("5xx")
  ) {
    statusType = f.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
  }

  return f.createTypeLiteralNode([
    f.createPropertySignature(undefined, "status", undefined, statusType),
    f.createPropertySignature(undefined, "payload", undefined, type),
  ]);
};
