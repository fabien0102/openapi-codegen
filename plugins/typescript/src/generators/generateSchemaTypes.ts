import * as c from "case";
import ts from "typescript";

import { ReferenceObject, SchemaObject } from "openapi3-ts/oas30";
import { createWatermark } from "../core/createWatermark";
import { getUsedImports } from "../core/getUsedImports";
import {
  OpenAPIComponentType,
  schemaToTypeAliasDeclaration,
} from "../core/schemaToTypeAliasDeclaration";
import { getEnumProperties } from "../utils/getEnumProperties";
import { ConfigBase, Context } from "./types";

import { isReferenceObject } from "openapi3-ts/oas30";

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
  const { useTypeImports = true, ...restConfig } = config;
  const finalConfig = { useTypeImports, ...restConfig };
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
    componentSchema: [string, SchemaObject | ReferenceObject][],
    currentComponent: OpenAPIComponentType
  ) =>
    componentSchema.reduce<ts.Node[]>(
      (mem, [name, schema]) => [
        ...mem,
        ...schemaToTypeAliasDeclaration(
          name,
          schema,
          {
            openAPIDocument: context.openAPIDocument,
            currentComponent: currentComponent,
          },
          finalConfig.useEnums
        ),
      ],
      []
    );

  const generateTypeAliasDeclarations = (
    componentSchemaEntries: [string, SchemaObject | ReferenceObject][],
    currentComponent: OpenAPIComponentType
  ) => {
    if (finalConfig.useEnums) {
      const enumSchemaEntries = getEnumProperties(componentSchemaEntries);
      const enumSchemas = enumSchemaEntries.reduce<ts.Node[]>(
        (mem, [name, schema]) => [
          ...mem,
          ...schemaToEnumDeclaration(name, schema, {
            openAPIDocument: context.openAPIDocument,
            currentComponent,
          }),
        ],
        []
      );

      const componentsSchemas = handleTypeAlias(
        componentSchemaEntries.filter(
          ([name]) => !enumSchemaEntries.some(([enumName]) => name === enumName)
        ),
        currentComponent
      );

      return [...enumSchemas, ...componentsSchemas];
    } else {
      return handleTypeAlias(componentSchemaEntries, currentComponent);
    }
  };

  const filenamePrefix =
    c.snake(finalConfig.filenamePrefix ?? context.openAPIDocument.info.title) +
    "-";

  const formatFilename =
    typeof finalConfig.formatFilename === "function"
      ? finalConfig.formatFilename
      : finalConfig.filenameCase
        ? c[finalConfig.filenameCase]
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
    const componentSchemaEntries = Object.entries(components.schemas);
    const schemas = generateTypeAliasDeclarations(
      componentSchemaEntries,
      "schemas"
    );

    await context.writeFile(
      files.schemas + ".ts",
      printNodes([
        createWatermark(context.openAPIDocument.info),
        ...getUsedImports(schemas, files, finalConfig.useTypeImports).nodes,
        ...schemas,
      ])
    );
  }

  // Generate `components/responses` types
  if (components.responses) {
    // Convert responses to schemas
    const componentsResponsesEntries = Object.entries(
      components.responses
    ).reduce<[string, SchemaObject | ReferenceObject][]>(
      (mem, [name, responseObject]) => {
        if (isReferenceObject(responseObject)) return mem;
        const mediaType = findCompatibleMediaType(responseObject);
        mem.push([name, mediaType?.schema || {}]);
        return mem;
      },
      []
    );

    const schemas = generateTypeAliasDeclarations(
      componentsResponsesEntries,
      "responses"
    );

    if (schemas.length) {
      await context.writeFile(
        files.responses + ".ts",
        printNodes([
          createWatermark(context.openAPIDocument.info),
          ...getUsedImports(schemas, files, finalConfig.useTypeImports).nodes,
          ...schemas,
        ])
      );
    }
  }

  // Generate `components/requestBodies` types
  if (components.requestBodies) {
    // Convert requestBodies to schemas
    const componentsRequestBodiesEntries = Object.entries(
      components.requestBodies
    ).reduce<[string, SchemaObject | ReferenceObject][]>(
      (mem, [name, requestBodyObject]) => {
        if (isReferenceObject(requestBodyObject)) return mem;
        const mediaType = findCompatibleMediaType(requestBodyObject);
        if (!mediaType || !mediaType.schema) return mem;
        mem.push([name, mediaType.schema]);
        return mem;
      },
      []
    );

    const schemas = generateTypeAliasDeclarations(
      componentsRequestBodiesEntries,
      "requestBodies"
    );

    if (schemas.length) {
      await context.writeFile(
        files.requestBodies + ".ts",
        printNodes([
          createWatermark(context.openAPIDocument.info),
          ...getUsedImports(schemas, files, finalConfig.useTypeImports).nodes,
          ...schemas,
        ])
      );
    }
  }

  // Generate `components/parameters` types
  if (components.parameters) {
    // Convert parameters to schemas
    const componentsParametersEntries = Object.entries(
      components.parameters
    ).reduce<[string, SchemaObject][]>((mem, [name, parameterObject]) => {
      if (isReferenceObject(parameterObject) || !parameterObject.schema)
        return mem;
      mem.push([name, parameterObject.schema as SchemaObject]);
      return mem;
    }, []);

    const schemas = generateTypeAliasDeclarations(
      componentsParametersEntries,
      "parameters"
    );

    await context.writeFile(
      files.parameters + ".ts",
      printNodes([
        createWatermark(context.openAPIDocument.info),
        ...getUsedImports(schemas, files, finalConfig.useTypeImports).nodes,
        ...schemas,
      ])
    );
  }

  return {
    schemasFiles: files,
  };
};
