import { Command } from "clipanion";

export class InitCommand extends Command {
  static paths = [["init"]];

  async execute() {
    this.context.stdout.write(`Init the config file`);
  }
}
