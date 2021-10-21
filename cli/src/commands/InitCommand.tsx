import { Command } from "clipanion";
import { askQuestion } from "../components/Input";
import { FileOptions, FromOptions, GithubOptions, UrlOptions } from "../types";

export class InitCommand extends Command {
  static paths = [["init"]];

  /**
   * Retrieve the existing configuration
   */
  getExistingConfiguration(): null | string {
    return null;
  }

  /**
   * Create a fresh configuration
   */
  createNewConfiguration(
    namespace: string,
    options: FromOptions,
    outdir: string
  ) {}

  /**
   * Update an existing configuration
   */
  updateConfiguration(
    namespace: string,
    options: FromOptions,
    outdir: string
  ) {}

  askForOverride(): boolean {
    return true;
  }

  askForNamespace(): string {
    return "todo";
  }

  askForSource(): FromOptions["source"] {
    return "file";
  }

  askForOptions(source: FromOptions["source"]): FromOptions {
    switch (source) {
      case "file": {
        return this.askForFileOptions();
      }
      case "url": {
        return this.askForUrlOptions();
      }
      case "file": {
        return this.askForFileOptions();
      }
      default:
        throw new Error("Unknown source");
    }
  }

  askForGithubOptions(): GithubOptions {
    return {} as any;
  }
  askForFileOptions(): FileOptions {
    return {} as any;
  }
  askForUrlOptions(): UrlOptions {
    return {} as any;
  }

  askForOutdir(): string {
    return "src/myAPI";
  }

  askForPlugins() {}

  async execute() {
    const existingConfig = this.getExistingConfiguration();
    if (existingConfig) {
      const shouldOverrideConfiguration = this.askForOverride();
      const namespace = this.askForNamespace();

      const writeConfiguration = (options: FromOptions, outdir: string) => {
        if (shouldOverrideConfiguration) {
          this.createNewConfiguration(namespace, options, outdir);
        } else {
          this.updateConfiguration(namespace, options, outdir);
        }
      };
      const source = this.askForSource();
      const options = this.askForOptions(source);
      const outdir = this.askForOutdir();
      writeConfiguration(options, outdir);
    }

    const value = await askQuestion("Wesh! La forme?", {
      defaultValue: "grave",
      hint: "toto",
    });
    await askQuestion("this should not be here");
    this.context.stdout.write(`Init the config file ${value}\n`);
  }
}
