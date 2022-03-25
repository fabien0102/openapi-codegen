import { UsageError } from "clipanion";
import { readFileSync, unlinkSync } from "fs";
import { HTTPError } from "got";
import { homedir } from "os";
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
      const { default: got } = await import("got");
      const { pathname } = new URL(options.url);
      const file = await got[options.method || "get"](options.url, {
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

    case "github": {
      // Retrieve Github token
      const { Prompt } = await import("../prompts/Prompt.js");
      const prompt = new Prompt();

      const token = await prompt.githubToken();

      // Retrieve specs
      const { default: got } = await import("got");

      try {
        const raw = await got
          .post("https://api.github.com/graphql", {
            headers: {
              "content-type": "application/json",
              "user-agent": "openapi-codegen",
              authorization: `bearer ${token}`,
            },
            body: JSON.stringify({
              query: `query {
            repository(name: "${options.repository}", owner: "${options.owner}") {
              object(expression: "${options.ref}:${options.specPath}") {
                ... on Blob {
                  text
                }
              }
            }
          }`,
            }),
          })
          .json<{
            data: { repository: { object: { text: string } | null } };
            errors?: [
              {
                message: string;
              }
            ];
          }>();

        prompt.close();
        if (raw.errors) {
          throw new UsageError(raw.errors[0].message);
        }
        if (raw.data.repository.object === null) {
          throw new UsageError(`No file found at "${options.specPath}"`);
        }

        let format: OpenAPISourceFile["format"] = "yaml";
        if (options.specPath.toLowerCase().endsWith("json")) {
          format = "json";
        }

        return { text: raw.data.repository.object.text, format };
      } catch (e) {
        if (
          e instanceof HTTPError &&
          e.response.statusCode === 401 &&
          !process.env.GITHUB_TOKEN
        ) {
          const removeToken = await prompt.confirm(
            "Your token doesn't have the correct permissions, should we remove it?"
          );
          prompt.close();

          if (removeToken) {
            const githubTokenPath = join(homedir(), ".openapi-codegen");
            unlinkSync(githubTokenPath);
            return await getOpenAPISourceFile(options);
          }
        }
        throw e;
      }
    }
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
