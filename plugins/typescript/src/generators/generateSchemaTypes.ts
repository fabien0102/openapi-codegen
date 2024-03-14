import * as c from "case";
import ts from "typescript";

import { ReferenceObject, SchemaObject } from "openapi3-ts";
import { createWatermark } from "../core/createWatermark";
import { getUsedImports } from "../core/getUsedImports";
import { schemaToTypeAliasDeclaration } from "../core/schemaToTypeAliasDeclaration";
import { getEnumProperties } from "../utils/getEnumProperties";
import { ConfigBase, Context } from "./types";

import { isReferenceObject } from "openapi3-ts";

import { findCompatibleMediaType } from "../core/findCompatibleMediaType";
import { schemaToEnumDeclaration } from "../core/schemaToEnumDeclaration";

type Config = ConfigBase;

/**
 * Generate schemas types (components & responses)
 * @param context CLI Context
 * @param config Configuration
 */
export const generateSchemaTypes = async (
  context: Context,
  config: Config = {}
) => {
  const { components } = context.openAPIDocument;
  if (!components) {
    throw new Error("No components founds!");
  }

  const sourceFile = ts.createSourceFile(
    "index.ts",
    "",
    ts.ScriptTarget.Latest
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  const printNodes = (nodes: ts.Node[]) =>
    nodes
      .map((node: ts.Node) => {
        return (
          printer.printNode(ts.EmitHint.Unspecified, node, sourceFile) +
          (ts.isJSDoc(node) ? "" : "\n")
        );
      })
      .join("\n");

  const handleTypeAlias = (
    componentSchema: [string, SchemaObject | ReferenceObject][]
  ) =>
    componentSchema.reduce<ts.Node[]>(
      (mem, [name, schema]) => [
        ...mem,
        ...schemaToTypeAliasDeclaration(
          name,
          schema,
          {
            openAPIDocument: context.openAPIDocument,
            currentComponent: "schemas",
          },
          config.useEnums
        ),
      ],
      []
    );

  const filenamePrefix =
    c.snake(config.filenamePrefix ?? context.openAPIDocument.info.title) + "-";

  const formatFilename =
    typeof config.formatFilename === "function"
      ? config.formatFilename
      : config.filenameCase
        ? c[config.filenameCase]
        : c.camel;
  const files = {
    requestBodies: formatFilename(filenamePrefix + "-request-bodies"),
    schemas: formatFilename(filenamePrefix + "-schemas"),
    parameters: formatFilename(filenamePrefix + "-parameters"),
    responses: formatFilename(filenamePrefix + "-responses"),
    utils: formatFilename(filenamePrefix + "-utils"),
  };

  // Generate `components/schemas` types
  if (components.schemas) {
    const schemas: ts.Node[] = [];
    const componentSchemaEntries = Object.entries(components.schemas);

    if (config.useEnums) {
      const enumSchemaEntries = getEnumProperties(componentSchemaEntries);
      const enumSchemas = enumSchemaEntries.reduce<ts.Node[]>(
        (mem, [name, schema]) => [
          ...mem,
          ...schemaToEnumDeclaration(name, schema, {
            openAPIDocument: context.openAPIDocument,
            currentComponent: "schemas",
          }),
        ],
        []
      );

      const componentsSchemas = handleTypeAlias(
        componentSchemaEntries.filter(
          ([name]) => !enumSchemaEntries.some(([enumName]) => name === enumName)
        )
      );

      schemas.push(...enumSchemas, ...componentsSchemas);
    } else {
      const componentsSchemas = handleTypeAlias(componentSchemaEntries);
      schemas.push(...componentsSchemas);
    }

    await context.writeFile(
      files.schemas + ".ts",
      printNodes([
        createWatermark(context.openAPIDocument.info),
        ...getUsedImports(schemas, files).nodes,
        ...schemas,
      ])
    );
  }

  // Generate `components/responses` types
  if (components.responses) {
    const componentsResponses = Object.entries(components.responses).reduce<
      ts.Node[]
    >((mem, [name, responseObject]) => {
      if (isReferenceObject(responseObject)) return mem;
      const mediaType = findCompatibleMediaType(responseObject);

      return [
        ...mem,
        ...schemaToTypeAliasDeclaration(name, mediaType?.schema || {}, {
          openAPIDocument: context.openAPIDocument,
          currentComponent: "responses",
        }),
      ];
    }, []);

    if (componentsResponses.length) {
      await context.writeFile(
        files.responses + ".ts",
        printNodes([
          createWatermark(context.openAPIDocument.info),
          ...getUsedImports(componentsResponses, files).nodes,
          ...componentsResponses,
        ])
      );
    }
  }

  // Generate `components/requestBodies` types
  if (components.requestBodies) {
    const componentsRequestBodies = Object.entries(
      components.requestBodies
    ).reduce<ts.Node[]>((mem, [name, requestBodyObject]) => {
      if (isReferenceObject(requestBodyObject)) return mem;
      const mediaType = findCompatibleMediaType(requestBodyObject);
      if (!mediaType || !mediaType.schema) return mem;

      return [
        ...mem,
        ...schemaToTypeAliasDeclaration(name, mediaType.schema, {
          openAPIDocument: context.openAPIDocument,
          currentComponent: "requestBodies",
        }),
      ];
    }, []);

    if (componentsRequestBodies.length) {
      await context.writeFile(
        files.requestBodies + ".ts",
        printNodes([
          createWatermark(context.openAPIDocument.info),
          ...getUsedImports(componentsRequestBodies, files).nodes,
          ...componentsRequestBodies,
        ])
      );
    }
  }

  // Generate `components/parameters` types
  if (components.parameters) {
    const componentsParameters = Object.entries(components.parameters).reduce<
      ts.Node[]
    >((mem, [name, parameterObject]) => {
      if (isReferenceObject(parameterObject) || !parameterObject.schema) {
        return mem;
      }
      return [
        ...mem,
        ...schemaToTypeAliasDeclaration(name, parameterObject.schema, {
          openAPIDocument: context.openAPIDocument,
          currentComponent: "parameters",
        }),
      ];
    }, []);

    await context.writeFile(
      files.parameters + ".ts",
      printNodes([
        createWatermark(context.openAPIDocument.info),
        ...getUsedImports(componentsParameters, files).nodes,
        ...componentsParameters,
      ])
    );
  }

  return {
    schemasFiles: files,
  };
};
