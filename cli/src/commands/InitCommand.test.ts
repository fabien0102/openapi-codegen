import { Cli } from "clipanion";
import { PassThrough } from "stream";
import getStream from "get-stream";
import { InitCommand } from "./InitCommand";

describe("InitCommand", () => {
  it("should print", async () => {
    const stream = new PassThrough();
    const promise = getStream(stream);

    const cli = new Cli();
    cli.register(InitCommand);
    cli.run(["init"], {
      stdout: stream,
      stderr: stream,
      stdin: process.stdin,
    });

    stream.end();

    const output = await promise;

    expect(output).toBe("Init the config file");
  });
});
