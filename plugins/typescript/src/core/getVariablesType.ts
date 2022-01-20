import ts, { factory as f } from "typescript";

/**
 * Get fetcher variables types from the operation types
 */
export const getVariablesType = ({
  requestBodyType,
  requestBodyOptional,
  headersType,
  headersOptional,
  pathParamsType,
  pathParamsOptional,
  queryParamsType,
  queryParamsOptional,
}: {
  requestBodyType: ts.TypeNode;
  requestBodyOptional: boolean;
  headersType: ts.TypeNode;
  headersOptional: boolean;
  pathParamsType: ts.TypeNode;
  pathParamsOptional: boolean;
  queryParamsType: ts.TypeNode;
  queryParamsOptional: boolean;
}) => {
  const variablesItems: ts.TypeElement[] = [];

  const hasProperties = (node: ts.Node) => {
    return (
      (!ts.isTypeLiteralNode(node) || node.members.length > 0) &&
      node.kind !== ts.SyntaxKind.UndefinedKeyword
    );
  };

  if (hasProperties(requestBodyType)) {
    variablesItems.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("body"),
        requestBodyOptional
          ? f.createToken(ts.SyntaxKind.QuestionToken)
          : undefined,
        requestBodyType
      )
    );
  }
  if (hasProperties(headersType)) {
    variablesItems.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("headers"),
        headersOptional
          ? f.createToken(ts.SyntaxKind.QuestionToken)
          : undefined,
        headersType
      )
    );
  }
  if (hasProperties(pathParamsType)) {
    variablesItems.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("pathParams"),
        pathParamsOptional
          ? f.createToken(ts.SyntaxKind.QuestionToken)
          : undefined,
        pathParamsType
      )
    );
  }
  if (hasProperties(queryParamsType)) {
    variablesItems.push(
      f.createPropertySignature(
        undefined,
        f.createIdentifier("queryParams"),
        queryParamsOptional
          ? f.createToken(ts.SyntaxKind.QuestionToken)
          : undefined,
        queryParamsType
      )
    );
  }

  return variablesItems.length === 0
    ? f.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
    : f.createTypeLiteralNode(variablesItems);
};
