import Apollo from "@apollo/client";

import { Box, Text } from "ink";
import React from "react";
import fetch from "cross-fetch";
import { join } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync } from "fs";

import type { GithubOptions } from "../types";

import { Message } from "./Message.js";
import {
  useSearchRepositoryQuery,
  useSearchUserQuery,
} from "./queries/github.js";
import { Select } from "./Select.js";
import { Input } from "./Input.js";
import { TextInput } from "./TextInput.js";

const { ApolloClient, HttpLink, InMemoryCache } = Apollo;

const githubTokenPath = join(homedir(), ".openapi-codegen");

type Step1 = Pick<Partial<GithubOptions>, "owner">;
type Step2 = Required<Step1> & Pick<Partial<GithubOptions>, "repository">;
type Step3 = Required<Step2> & Pick<Partial<GithubOptions>, "source">;
type Step4 = Required<Step3> & Pick<Partial<GithubOptions>, "specPath">;

type State =
  | (Step1 & { step: 1 })
  | (Step2 & { step: 2 })
  | (Step3 & { step: 3 })
  | (Step4 & { step: 4 });

export type GithubProps = {
  onSubmit: (value: GithubOptions) => void;
};

export const Github = ({ onSubmit }: GithubProps) => {
  const [state, setState] = React.useState<State>({ step: 1 });
  const [token, setToken] = React.useState<string | undefined>(
    getEnvGithubToken()
  );

  const apolloClient = React.useMemo(
    () =>
      new ApolloClient({
        link: new HttpLink({
          uri: "https://api.github.com/graphql",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
          fetch,
        }),
        cache: new InMemoryCache(),
      }),
    [token]
  );

  const {
    data: users,
    error: usersError,
    loading: usersLoading,
  } = useSearchUserQuery({
    variables: {
      query: state.owner || "",
    },
    skip: !state.owner,
    client: apolloClient,
  });

  const {
    data: repositories,
    error: repositoriesError,
    loading: repositoriesLoading,
  } = useSearchRepositoryQuery({
    variables: {
      query: (state.step === 2 && `${state.owner}/`) || "",
    },
    skip: state.step !== 2,
    client: apolloClient,
  });

  if (!token) {
    return (
      <Box flexDirection="column">
        <Input
          message="Github token"
          onSubmit={(val) => {
            setToken(val);
            writeFileSync(githubTokenPath, val);
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
  }

  switch (state.step) {
    case 1:
      return (
        <Box flexDirection="column">
          <Box>
            <Message>Owner?</Message>
            <TextInput
              onChange={(owner) => setState({ step: 1, owner })}
              value={state.owner || ""}
            />
          </Box>
          {usersLoading && <Text>Loading…</Text>}
          {usersError && <Box>{usersError.message}</Box>}
          {users && users.search.nodes && (
            <Select
              choices={users.search.nodes.map((node) =>
                node?.__typename === "User"
                  ? { label: node.login, value: node.login }
                  : { label: "-", value: "-" }
              )}
              onSubmit={(owner) => setState({ step: 2, owner })}
            />
          )}
        </Box>
      );
    case 2:
      return (
        <Box flexDirection="column">
          <Box>
            <Message>Pick a repository</Message>
            <Text color="blackBright">{state.owner}/ </Text>
            <TextInput
              onChange={(repository) => setState({ ...state, repository })}
              value={state.repository || ""}
            />
          </Box>
          {repositoriesLoading && <Text>Loading…</Text>}
          {repositoriesError && <Box>{repositoriesError.message}</Box>}
          {repositories && repositories.search.nodes && (
            <Select
              choices={repositories.search.nodes.map((node) =>
                node?.__typename === "Repository"
                  ? { label: node.name, value: node.name }
                  : {
                      label: "-",
                      value: "-",
                    }
              )}
              onSubmit={(repository) =>
                setState({ ...state, step: 3, repository })
              }
            />
          )}
        </Box>
      );
  }

  return null;
};

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
