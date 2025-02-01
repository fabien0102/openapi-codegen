#!/usr/bin/env node

import { Cli } from "clipanion";

import { GenerateCommand } from "./commands/GenerateCommand.js";
import { InitCommand } from "./commands/InitCommand.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const [_node, _app, ...args] = process.argv;
const packageJSON = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
);

const cli = new Cli({
  binaryLabel: `OpenAPI codegen`,
  binaryName: `openapi-codegen`,
  binaryVersion: packageJSON.version,
});

cli.register(InitCommand);
cli.register(GenerateCommand);
cli.runExit(args);
