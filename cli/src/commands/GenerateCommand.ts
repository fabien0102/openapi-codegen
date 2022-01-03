import { Command, Option } from "clipanion";
import fsExtra from "fs-extra";
import path from "path/posix";
import * as swc from "@swc/core";
import prettier from "prettier";
import { fileURLToPath } from "url";
import slash from "slash";

import { Config, Namespace } from "../types";
import { getOpenAPISourceFile } from "../core/getOpenAPISourceFile.js";
import { parseOpenAPISourceFile } from "../core/parseOpenAPISourceFile.js";

const { unlink, outputFile, existsSync } = fsExtra;
const __filename = fileURLToPath(import.meta.url);

// if no config -> tell the user to do `openapi-codegen init`
// if config -> adjust examples/documentation regarding the keys
// Flags should reflects `getOpenAPISourceFile.Options`

export class GenerateCommand extends Command {
  config = Option.String(`-c,--config`, {
    description: "Configuration file path",
  });

  namespace = Option.String();

  static paths = [["gen"], ["generate"], Command.Default];
  static usage = Command.Usage({
    description: "Generate types & components from an OpenAPI file",
    examples: [
      [`From a config key`, `$0 gen myapi`],
      [`With some override`, `$0 gen myapi --branch awesome-feature`],
    ],
  });

  async loadConfigs(): Promise<Record<Namespace, Config>> {
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
      await outputFile(transpiledPath, code);

      // Compute the result
      const { default: config } = await import(
        path.relative(slash(__filename), slash(transpiledPath).slice(3))
      );

      // Delete the transpiled file
      await unlink(transpiledPath);

      // Return the result
      return config;
    } else {
      return await import(
        path.relative(slash(__filename), slash(userConfigPath)).slice(3)
      );
    }
  }

  async execute() {
    const configs = await this.loadConfigs();
    if (!(this.namespace in configs)) {
      this.context.stdout.write(
        `"${this.namespace}" is not defined in your configuration`
      );
      process.exit(1);
    }

    const config = configs[this.namespace];
    const sourceFile = await getOpenAPISourceFile(config.from);
    const openAPIDocument = await parseOpenAPISourceFile(sourceFile);
    const prettierConfig = await prettier.resolveConfig(process.cwd());

    const writeFile = async (file: string, data: string) => {
      await outputFile(
        path.join(process.cwd(), config.outputDir, file),
        prettier.format(data, { parser: "babel-ts", ...prettierConfig })
      );
    };

    const existsFile = (file: string) => {
      return existsSync(path.join(process.cwd(), file));
    };

    await config.to({
      openAPIDocument,
      outputDir: config.outputDir,
      writeFile,
      existsFile,
    });
  }
}
