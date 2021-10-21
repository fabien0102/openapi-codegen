import { Cli } from "clipanion";

import { GenerateCommand } from "./commands/GenerateCommand";
import { InitCommand } from "./commands/InitCommand";

const [_node, _app, ...args] = process.argv;

const cli = new Cli({
  binaryLabel: `OpenAPI codegen`,
  binaryName: `openapi-codegen`,
  binaryVersion: `1.0.0`, // TODO read from package.json
});

cli.register(InitCommand);
cli.register(GenerateCommand);
cli.runExit(args);
