import { Command, Option } from "clipanion";
import fs from "fs/promises";
import { join } from "path";
import * as swc from "@swc/core";

import { Config, Namespace } from "../types";
import { getOpenAPISourceFile } from "../core/getOpenAPISourceFile";
import { parseOpenAPISourceFile } from "../core/parseOpenAPISourceFile";

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
    const userConfigPath = join(
      process.cwd(),
      this.config || "openapi-codegen.config.ts"
    );

    await swc.transformFile(userConfigPath);
    return require(userConfigPath).default;
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

    const writeFile = async (file: string, data: string) => {
      await fs.writeFile(join(process.cwd(), config.outputDir, file), data);
    };

    await config.to({
      openAPIDocument,
      outputDir: config.outputDir,
      writeFile,
    });
  }
}
