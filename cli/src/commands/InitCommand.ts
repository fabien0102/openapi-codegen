import { Command, Option } from "clipanion";
import { posix as path } from "path";
import fsExtra from "fs-extra";
import ts from "typescript";

import type { FileOptions, FromOptions, UrlOptions } from "../types/index";

import {
  generateConfigProperty,
  Plugin,
} from "../core/generateConfigProperty.js";
import { Prompt } from "../prompts/Prompt.js";
import { getText } from "../utils/getText.js";
import emptyConfig from "../templates/emptyConfig.js";

export class InitCommand extends Command {
  static paths = [["init"]];

  config = Option.String(`-c,--config`, {
    description: "Configuration file path",
  });

  dryRun = Option.Boolean("--dry-run", {
    description: "Print the file in the stdout",
  });

  private prompt = new Prompt();

  private async getConfigSourceFile() {
    const userConfigPath = path.join(
      process.cwd(),
      this.config || "openapi-codegen.config.ts"
    );

    if (fsExtra.existsSync(userConfigPath)) {
      const sourceText = await fsExtra.readFile(userConfigPath, "utf-8");
      const sourceFile = ts.createSourceFile(
        "openapi-codegen.config.ts",
        sourceText,
        ts.ScriptTarget.Latest
      );

      // Check if the config have `export default defineConfig({})`
      let isValidConfig = false;
      const importModules = new Set<string>();
      const visitor: ts.Visitor = (node) => {
        if (
          ts.isExportAssignment(node) &&
          ts.isCallExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.escapedText === "defineConfig"
        ) {
          isValidConfig = true;
        }
        if (ts.isImportDeclaration(node)) {
          importModules.add(getText(node.moduleSpecifier));
        }

        return node.forEachChild(visitor);
      };

      ts.visitNode(sourceFile, visitor);

      if (isValidConfig) {
        return {
          sourceFile,
          importModules: Array.from(importModules.values()),
        };
      }
    }

    // Load and return emptyConfig.ts
    const sourceFile = ts.createSourceFile(
      "openapi-codegen.config.ts",
      emptyConfig,
      ts.ScriptTarget.Latest
    );

    return { sourceFile, importModules: ["@openapi-codegen/cli"] };
  }

  private async askForFile(): Promise<FileOptions> {
    return {
      relativePath: await this.prompt.input({
        message: "Relative path",
        hint: "Example: ./openapi.json",
      }),
      source: "file",
    };
  }

  private async askForUrl(): Promise<UrlOptions> {
    return {
      source: "url",
      url: await this.prompt.input({
        message: "Url",
        hint: "Example: https://.../openapi.json",
      }),
    };
  }

  async execute() {
    const config = await this.getConfigSourceFile();

    const source = await this.prompt.select({
      choices: [
        { label: "File", value: "file" as const },
        { label: "Url", value: "url" as const },
        { label: "Github", value: "github" as const },
      ],
      message: "Select the source of your OpenAPI",
    });

    const from: FromOptions =
      source === "file"
        ? await this.askForFile()
        : source === "url"
        ? await this.askForUrl()
        : await this.prompt.github();

    const namespace = await this.prompt.input({
      message: "What namespace do you want for your API?",
    });

    const plugin = await this.prompt.select<Plugin>({
      message: "What do you want to generate?",
      choices: [
        { label: "Types only", value: "typescript/types-only" },
        { label: "Generic Fetchers", value: "typescript/fetch" },
        { label: "React Query components", value: "typescript/react-query" },
      ],
    });

    const outputDir = await this.prompt.input({
      message: "Which folder do you want to generate?",
    });
    this.prompt.close();

    const configProperty = generateConfigProperty({
      namespace,
      options: {
        from,
        outputDir,
        plugin,
      },
    });

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });

    if (this.dryRun) {
      this.context.stdout.write(
        printer.printNode(
          ts.EmitHint.Unspecified,
          configProperty,
          config.sourceFile
        )
      );
    } else {
      // write new config
      // update package.json if no command
      this.context.stdout.write(JSON.stringify(from));
      // little message about the next step here
    }
  }
}
