import { readFileSync } from "fs";
import got from "got";
import { join, parse } from "path";
import { URL } from "url";
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

    case "url": {
      const { pathname } = new URL(options.url);
      const file = await got[options.method](options.url, {
        headers: options.headers || {},
      });
      let format: OpenAPISourceFile["format"] = "yaml";
      if (
        pathname.toLowerCase().endsWith("json") ||
        file.headers["content-type"]?.startsWith("application/json")
      ) {
        format = "json";
      }

      return { text: file.body, format };
    }

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
