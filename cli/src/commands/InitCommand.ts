import { Command, Option } from "clipanion";
import { posix as path } from "path";
import fsExtra from "fs-extra";
import ts from "typescript";
import { highlight } from "cli-highlight";
import prettier from "prettier";
import format from "case";

import type { FileOptions, FromOptions, UrlOptions, Plugin } from "../types";

import {
  generateConfigProperty,
  getImports,
} from "../core/generateConfigProperty.js";
import { Prompt } from "../prompts/Prompt.js";
import { getText } from "../utils/getText.js";
import emptyConfig from "../templates/emptyConfig.js";
import { updateConfig } from "../core/updateConfig.js";

export class InitCommand extends Command {
  static paths = [["init"]];

  config = Option.String(`-c,--config`, {
    description: "Configuration file path",
  });

  dryRun = Option.Boolean("--dry-run", {
    description: "Print the file in the stdout",
  });

  private prompt = new Prompt();

  private hasDependencyInstalled(name: string, packageJSON: any) {
    if (typeof packageJSON !== "object") return false;
    if (
      typeof packageJSON.dependencies === "object" &&
      packageJSON.dependencies[name]
    )
      return true;
    if (
      typeof packageJSON.devDependencies === "object" &&
      packageJSON.devDependencies[name]
    )
      return true;

    return false;
  }

  private async getConfigSourceFile(userConfigPath: string) {
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
          isExistingConfig: true,
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

    return {
      isExistingConfig: false,
      sourceFile,
      importModules: ["@openapi-codegen/cli"],
    };
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
    const userConfigPath = path.join(
      process.cwd(),
      this.config || "openapi-codegen.config.ts"
    );

    const config = await this.getConfigSourceFile(userConfigPath);

    const source = await this.prompt.select({
      choices: [
        { label: "File", value: "file" as const },
        { label: "Url", value: "url" as const },
        // { label: "Github", value: "github" as const },
      ],
      message: "Select the source of your OpenAPI",
    });

    const from: FromOptions =
      source === "file"
        ? await this.askForFile()
        : source === "url"
          ? await this.askForUrl()
          : await this.prompt.github("todo: inject the token");

    const namespace = format.camel(
      await this.prompt.input({
        message: "What namespace do you want for your API?",
      })
    );

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

    const importsToInsert = getImports(plugin);

    const updatedConfigSourceFile = updateConfig({
      sourceFile: config.sourceFile,
      existingImports: config.importModules,
      importsToInsert,
      configProperty,
    });

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });

    const prettierConfig = await prettier.resolveConfig(process.cwd());

    const updatedConfig = await prettier.format(
      printer.printFile(updatedConfigSourceFile),
      { parser: "babel-ts", ...prettierConfig }
    );

    if (this.dryRun) {
      this.context.stdout.write(
        highlight(updatedConfig, {
          language: "typescript",
        })
      );
    } else {
      const nextSteps: string[] = [];
      try {
        const packageJson = await fsExtra.readJSON(
          path.join(process.cwd(), "package.json")
        );
        const hasCli = this.hasDependencyInstalled(
          "@openapi-codegen/cli",
          packageJson
        );
        const hasTsPlugin = this.hasDependencyInstalled(
          "@openapi-codegen/typescript",
          packageJson
        );
        if (!hasCli && !hasTsPlugin) {
          nextSteps.push("npm install -D @openapi-codegen/{cli,typescript}");
        } else if (!hasCli) {
          nextSteps.push("npm install -D @openapi-codegen/cli");
        } else if (!hasTsPlugin) {
          nextSteps.push("npm install -D @openapi-codegen/typescript");
        }
      } catch {
        nextSteps.push("npm install -D @openapi-codegen/{cli,typescript}");
      }
      nextSteps.push(`npx openapi-codegen gen ${namespace}`);

      await fsExtra.writeFile(userConfigPath, updatedConfig);
      if (config.isExistingConfig) {
        this.context.stdout.write(
          `The config "${namespace}" has been added to your current config successfully 🥳\n`
        );
      } else {
        this.context.stdout.write(`A new config file has been created!\n`);
      }

      this.context.stdout.write(
        `\n  Next steps:\n   - ${nextSteps.join("\n   - ")}\n`
      );
    }
  }
}
