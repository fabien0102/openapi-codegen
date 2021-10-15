import { readFileSync } from "fs";
import { join, parse } from "path";
import { FromOptions, OpenAPISourceFile } from "../types";

/**
 * Retrieve the OpenAPI source.
 *
 * @param options
 */
export const getOpenAPISourceFile = async (
  options: FromOptions
): Promise<OpenAPISourceFile> => {
  switch (options.source) {
    case "file":
      const text = readFileSync(
        join(process.cwd(), options.relativePath),
        "utf-8"
      );
      const { ext } = parse(options.relativePath);
      const format = getFormat(ext);

      return { text, format };

    case "url":
      // TODO
      return { text: "", format: "json" };

    case "github":
      // TODO
      return { text: "", format: "json" };
  }
};

/**
 * Get the format of the specifications (yaml or json)
 *
 * @param extension
 */
export const getFormat = (extension: string) => {
  if (extension.startsWith(".")) {
    extension = extension.slice(1);
  }
  if (extension.toLowerCase() === "yaml") {
    return "yaml";
  }
  if (extension.toLowerCase() === "yml") {
    return "yaml";
  }
  if (extension.toLowerCase() === "json") {
    return "json";
  }
  throw new Error(`"${extension}" extension file is not supported!`);
};
