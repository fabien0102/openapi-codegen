import { OpenAPIObject } from "openapi3-ts";
import * as c from "case";

/**
 * Generator context (provided by `@openapi-codegen/cli`)
 */
export type Context = {
  openAPIDocument: OpenAPIObject;
  writeFile: (file: string, data: string) => Promise<void>;
  readFile: (file: string) => Promise<string>;
  existsFile: (file: string) => boolean;
};

/**
 * Generator configuration
 */
export type ConfigBase = {
  /**
   * @default openapi.info.title
   */
  filenamePrefix?: string;
  /**
   * Case convention for filenames.
   *
   * @default camel
   */
  filenameCase?: keyof Pick<typeof c, "snake" | "camel" | "kebab" | "pascal">;
  /**
   * Allows customizing the filename.
   * If provided, `filenameCase` will be ignored.
   */
  formatFilename?: (filename: string) => string;
  /**
   * Allows using explicit enums instead of string unions.
   *
   * @default false
   */
  useEnums?: boolean;
};
