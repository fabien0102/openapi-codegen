import { OpenAPIObject } from "openapi3-ts";

/**
 * OpenAPI source file.
 */
export type OpenAPISourceFile = {
  /**
   * Raw text
   */
  text: string;
  /**
   * File format
   */
  format: "json" | "yaml";
};

export type FileOptions = {
  source: "file";

  /**
   * Relative path of the spec file
   */
  relativePath: string;
};

export type UrlOptions = {
  source: "url";

  /**
   * URL of the spec file
   */
  url: string;

  /**
   * Additional headers
   */
  headers?: { [key: string]: string };

  /**
   * HTTP Method
   */
  method?: "get" | "post";
};

export type GithubOptions = {
  source: "github";

  /**
   * Owner of the repository
   */
  owner: string;

  /**
   * Repository name
   */
  repository: string;

  /**
   * Git reference (branch name, commit sha or tag)
   */
  ref: string;

  /**
   * OpenAPI specs file path
   */
  specPath: string;
};

export type FromOptions = FileOptions | UrlOptions | GithubOptions;

export type Context = {
  openAPIDocument: OpenAPIObject;
  outputDir: string;
  writeFile: (file: string, data: string) => Promise<void>;
  readFile: (file: string) => Promise<string>;
  existsFile: (file: string) => boolean;
};

/**
 * Namespace of your api.
 *
 * This will be used to call the config
 *
 * example:
 * $ openapi-codegen gen {namespace}
 */
export type Namespace = string;

export type Config = {
  from: FromOptions;
  outputDir: string;
  to: (context: Context) => Promise<void>;
};

export type Import = {
  namedImports: string[];
  module: string;
};

export type Plugin =
  | "typescript/types-only"
  | "typescript/react-query"
  | "typescript/fetch";
