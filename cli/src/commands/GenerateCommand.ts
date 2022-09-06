import { Command, Option, UsageError } from "clipanion";
import * as t from "typanion";
import fsExtra from "fs-extra";
import { posix as path } from "path";
import * as swc from "@swc/core";
import prettier from "prettier";
import { fileURLToPath } from "url";
import slash from "slash";

import {
  Config,
  FileOptions,
  FromOptions,
  GithubOptions,
  Namespace,
  UrlOptions,
} from "../types";
import { getOpenAPISourceFile } from "../core/getOpenAPISourceFile.js";
import { parseOpenAPISourceFile } from "../core/parseOpenAPISourceFile.js";
import { Prompt } from "../prompts/Prompt.js";

const __filename = fileURLToPath(import.meta.url);

// if no config -> tell the user to do `openapi-codegen init`
// if config -> adjust examples/documentation regarding the keys

export class GenerateCommand extends Command {
  config = Option.String(`-c,--config`, {
    description: "Configuration file path",
    env: "OPENAPI_CODEGEN_CONFIG",
  });

  namespace = Option.String();

  source = Option.String(`--source`, {
    description: "Source of the spec (file, url or github)",
    env: "OPENAPI_CODEGEN_SOURCE",
    validator: t.isEnum(["file", "url", "github"]),
  });

  // source=file options
  relativePath = Option.String(`--relativePath`, {
    description: "[source=file] Relative path of the spec file",
    env: "OPENAPI_CODEGEN_FILE_PATH",
  });

  // source=url options
  url = Option.String("--url", {
    description: "[source=url] URL of the spec file",
    env: "OPENAPI_CODEGEN_URL",
  });
  method = Option.String("--method", {
    description: "[source=url] HTTP Method",
    env: "OPENAPI_CODEGEN_URL_METHOD",
    validator: t.isEnum(["get", "post"]),
  });

  // source=github options
  owner = Option.String("--owner", {
    description: "[source=github] Owner of the repository",
    env: "OPENAPI_CODEGEN_GITHUB_OWNER",
  });
  repository = Option.String("--repository,--repo", {
    description: "[source=github] Repository name",
    env: "OPENAPI_CODEGEN_GITHUB_REPOSITORY",
  });
  ref = Option.String("--ref", {
    description: "[source=github] Git reference (commit sha, branch or tag)",
    env: "OPENAPI_CODEGEN_GITHUB_REF",
  });
  specPath = Option.String("--specPath", {
    description: "[source=github] OpenAPI specs file path",
    env: "OPENAPI_CODEGEN_GITHUB_SPEC_PATH",
  });
  pullRequest = Option.String("--pr,--pull-request", {
    description: "[source=github] Select a specific pull-request as ref",
    env: "OPENAPI_CODEGEN_GITHUB_PULL_REQUEST",
    validator: t.isNumber(),
    tolerateBoolean: true,
  });

  static paths = [["gen"], ["generate"], Command.Default];
  static usage = Command.Usage({
    description: "Generate types & components from an OpenAPI file",
    examples: [
      [`From a config key`, `$0 gen myapi`],
      [`With some override`, `$0 gen myapi --ref awesome-feature`],
    ],
  });

  private async loadConfigs(): Promise<Record<Namespace, Config>> {
    const userConfigPath = path.join(
      process.cwd(),
      this.config || "openapi-codegen.config.ts"
    );
    const { dir, name, ext } = path.parse(userConfigPath);
    const isTs = ext.toLowerCase() === ".ts";

    if (isTs) {
      const transpiledPath = `${dir}/${name}.mjs`;

      const { code } = await swc.transformFile(userConfigPath, {
        jsc: {
          target: "es2022",
        },
        module: {
          type: "es6",
        },
      });

      // Write the transpiled file (.js)
      await fsExtra.outputFile(transpiledPath, code);

      // Compute the result
      const { default: config } = await import(
        path.relative(path.parse(slash(__filename)).dir, slash(transpiledPath))
      );

      // Delete the transpiled file
      await fsExtra.unlink(transpiledPath);

      // Return the result
      return config;
    } else {
      return await import(
        path.relative(path.parse(slash(__filename)).dir, slash(userConfigPath))
      );
    }
  }

  /**
   * Get `from` options consolidated with cli flags.
   *
   * @param config config from openapi-codegen.config.ts
   * @returns consolidated configuration
   */
  private getFromOptions(config: Config): FromOptions {
    const source = this.source || config.from.source;

    switch (source) {
      case "file": {
        if (config.from.source === "file") {
          return {
            ...config.from,
            relativePath: this.relativePath ?? config.from.relativePath,
          } as FileOptions;
        } else {
          if (!this.relativePath) {
            throw new UsageError("--relativePath argument is missing");
          }
          return {
            source: "file",
            relativePath: this.relativePath,
          } as FileOptions;
        }
      }

      case "url":
        if (config.from.source === "url") {
          return {
            ...config.from,
            url: this.url ?? config.from.url,
            method: this.method ?? config.from.method,
          } as UrlOptions;
        } else {
          if (!this.url) {
            throw new UsageError("--url argument is missing");
          }
          return {
            source: "url",
            url: this.url,
            method: this.method,
          } as UrlOptions;
        }

      case "github":
        if (config.from.source === "github") {
          return {
            ...config.from,
            owner: this.owner ?? config.from.owner,
            ref: this.ref ?? config.from.ref,
            repository: this.repository ?? config.from.repository,
            specPath: this.specPath ?? config.from.specPath,
          } as GithubOptions;
        } else {
          if (!this.owner) {
            throw new UsageError("--owner argument is missing");
          }
          if (!this.ref && !this.pullRequest) {
            throw new UsageError("--ref argument is missing");
          }
          if (!this.repository) {
            throw new UsageError("--repository argument is missing");
          }
          if (!this.specPath) {
            throw new UsageError("--specPath argument is missing");
          }

          return {
            source: "github",
            ref: this.ref || "main", // Fallback for --pr mode
            owner: this.owner,
            repository: this.repository,
            specPath: this.specPath,
          } as GithubOptions;
        }

      default:
        throw new UsageError("--source argument is invalid");
    }
  }

  async execute() {
    const configs = await this.loadConfigs();
    if (!(this.namespace in configs)) {
      throw new UsageError(
        `"${this.namespace}" is not defined in your configuration`
      );
    }

    const config = configs[this.namespace];
    const options = this.getFromOptions(config);
    if (options.source === "github" && this.pullRequest) {
      const prompt = new Prompt();
      const token = await prompt.githubToken();
      const pullRequest = await prompt.githubPullRequest({
        ...options,
        token,
        pullRequestNumber:
          typeof this.pullRequest === "number" ? this.pullRequest : undefined,
      });

      options.ref = pullRequest.ref;
      options.owner = pullRequest.owner;
      options.repository = pullRequest.repository;
    }

    const sourceFile = await getOpenAPISourceFile(options);
    const openAPIDocument = await parseOpenAPISourceFile(sourceFile);
    const prettierConfig = await prettier.resolveConfig(process.cwd());

    const writeFile = async (file: string, data: string) => {
      await fsExtra.outputFile(
        path.join(process.cwd(), config.outputDir, file),
        prettier.format(data, { parser: "babel-ts", ...prettierConfig })
      );
    };

    const readFile = (file: string) => {
      return fsExtra.readFile(
        path.join(process.cwd(), config.outputDir, file),
        "utf-8"
      );
    };

    const existsFile = (file: string) => {
      return fsExtra.existsSync(
        path.join(process.cwd(), config.outputDir, file)
      );
    };

    await config.to({
      openAPIDocument,
      outputDir: config.outputDir,
      writeFile,
      existsFile,
      readFile,
    });
  }
}
