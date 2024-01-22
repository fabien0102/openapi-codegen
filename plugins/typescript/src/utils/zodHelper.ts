import { camel } from "case";
import ts, { factory as f } from "typescript";
import { createNamespaceImport } from "../core/createNamespaceImport";

const zodSchemasNamespace = "ZodSchemas"

export const createZodNamespaceImport = (fileName: string | undefined) => {
    if (fileName) {
        return [createNamespaceImport(zodSchemasNamespace, './' + fileName, false)]
    } else {
        return []
    }
}

export const createZodValidatorResponse = (dataType: ts.Node, printNodes: (nodes: ts.Node[]) => string): ts.PropertyAssignment[] => {
    if (dataType.kind === ts.SyntaxKind.UndefinedKeyword) {
        return []
    }

    const schemaName = camel(`${printNodes([dataType]).replace('\n', '').split('.').at(-1)}Schema`)

    return [
        f.createPropertyAssignment(
            "responseValidator",
            f.createArrowFunction(
                undefined,
                undefined,
                [f.createParameterDeclaration(undefined, undefined, "data")],
                undefined,
                undefined,
                f.createCallExpression(
                    f.createPropertyAccessExpression(
                        f.createPropertyAccessExpression(f.createIdentifier(zodSchemasNamespace), schemaName),
                        "parseAsync"
                    ),
                    undefined,
                    [f.createIdentifier("data")]
                )
            )
        )
    ];
};
