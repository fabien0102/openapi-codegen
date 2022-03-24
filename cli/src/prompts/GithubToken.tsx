import React, { useState } from "react";
import { Box, Text } from "ink";

import { join } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { Input } from "./Input.js";

export type GithubTokenProps = {
  onSubmit: (token: string) => void;
};

/**
 * Retrieve github token, ask if not already set.
 */
export const GithubToken = ({ onSubmit }: GithubTokenProps) => {
  const token = getEnvGithubToken();
  const [hasSubmit, setHasSubmit] = useState(false);

  if (hasSubmit) return null;

  if (token) {
    onSubmit(token);
    setHasSubmit(true);
  }

  return (
    <Box flexDirection="column">
      <Input
        message="Github token"
        onSubmit={(val) => {
          writeFileSync(githubTokenPath, val);
          onSubmit(val);
          setHasSubmit(true);
        }}
      />
      <Box marginTop={1} paddingLeft={2} flexDirection="column">
        <Text>Please provide a GitHub token with `repo` rules checked</Text>
        <Text color="cyan">
          https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line
        </Text>
      </Box>
    </Box>
  );
};

const githubTokenPath = join(homedir(), ".openapi-codegen");

/**
 * Retrieve stored github token
 */
const getEnvGithubToken = () => {
  let accessToken = process.env.GITHUB_TOKEN;
  if (!accessToken && existsSync(githubTokenPath)) {
    accessToken = readFileSync(githubTokenPath, "utf-8");
  }

  return accessToken;
};
