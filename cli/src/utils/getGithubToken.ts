import * as prompt from "@clack/prompts";
import { join } from "path";
import { homedir } from "os";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { handlePromptCancel } from "./handlePromptCancel";

/**
 * Ask for GitHub token if needed and save it for later.
 */
export async function getGithubToken() {
  const envToken = await getEnvGithubToken();
  if (envToken) return envToken;

  const token = await prompt
    .text({
      message: "Please provide a GitHub token with `repo` rules checked",
    })
    .then(handlePromptCancel);

  await writeFile(githubTokenPath, token);

  return token;
}

const githubTokenPath = join(homedir(), ".openapi-codegen");

/**
 * Retrieve stored github token
 */
async function getEnvGithubToken() {
  let accessToken = process.env.GITHUB_TOKEN;
  if (!accessToken && existsSync(githubTokenPath)) {
    accessToken = await readFile(githubTokenPath, "utf-8");
  }

  return accessToken;
}
