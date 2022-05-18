import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

import { Box, Text } from "ink";
import fetch from "got-fetch";
import React from "react";

import type { GithubOptions } from "../types";

import { Message } from "./Message.js";
import {
  useSearchRepositoryQuery,
  useSearchUserQuery,
} from "./queries/github.js";
import { useGetTree } from "./queries/useGetTree.js";
import { Select } from "./Select.js";
import { TextInput } from "./TextInput.js";
import { GithubToken } from "./GithubToken.js";
import { Spinner } from "./Spinner.js";
import { Answer } from "./Answer.js";

type Step1 = Pick<Partial<GithubOptions>, "owner">;
type Step2 = Required<Step1> & Pick<Partial<GithubOptions>, "repository">;
type Step3 = Required<Step2> & Pick<Partial<GithubOptions>, "specPath">;
type Step4 = Required<Step3>;

type State =
  | (Step1 & { step: 1 })
  | (Step2 & { step: 2 })
  | (Step3 & { step: 3 })
  | (Step4 & { step: 4 });

export type GithubProps = {
  onSubmit: (value: GithubOptions) => void;
};

export const Github = ({ onSubmit }: GithubProps) => {
  const [state, setState] = React.useState<State>({
    step: 1,
  });
  const [token, setToken] = React.useState<string>();
  const [search, setSearch] = React.useState("");

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
          fetch: fetch as any,
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
      query: (state.step === 2 && `${state.owner}/${state.repository}`) || "",
    },
    skip: state.step !== 2,
    client: apolloClient,
  });

  const {
    data: files,
    error: filesError,
    loading: filesLoading,
  } = useGetTree({
    token,
    owner: state.step === 3 ? state.owner : "",
    repo: state.step === 3 ? state.repository : "",
    skip: state.step !== 3,
  });

  if (!token) {
    return <GithubToken onSubmit={setToken} />;
  }

  switch (state.step) {
    case 1:
      return (
        <Box flexDirection="column" key="step-1">
          <Box>
            <Message>Owner?</Message>
            <TextInput
              onChange={(owner) => setState({ step: 1, owner })}
              value={state.owner || ""}
            />
          </Box>
          {usersLoading && (
            <Text>
              <Spinner />
              Loading…
            </Text>
          )}
          {usersError && <Box>{usersError.message}</Box>}
          {users && users.search.nodes && (
            <Select
              choices={users.search.nodes.map((node) =>
                node?.__typename === "User" ||
                node?.__typename === "Organization"
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
        <Box flexDirection="column" key="step-2">
          <Box>
            <Message>Owner?</Message>
            <Answer>{state.owner}</Answer>
          </Box>
          <Box>
            <Message>Repository?</Message>
            <TextInput
              onChange={(repository) => setState({ ...state, repository })}
              value={state.repository || ""}
            />
          </Box>
          {repositoriesLoading && (
            <Text>
              <Spinner />
              Loading…
            </Text>
          )}
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

    case 3:
      return (
        <Box flexDirection="column" key="step-3">
          <Box>
            <Message>Owner?</Message>
            <Answer>{state.owner}</Answer>
          </Box>
          <Box>
            <Message>Repository?</Message>
            <Answer>{state.repository}</Answer>
          </Box>
          <Box>
            <Message>OpenAPI file?</Message>
            <TextInput onChange={setSearch} value={search} />
          </Box>
          {filesError && <Box>{filesError}</Box>}
          {filesLoading && (
            <Text>
              <Spinner />
              Loading…
            </Text>
          )}
          <Select
            choices={files
              .filter((file) => {
                if (search) {
                  return new RegExp(search, "i").exec(file.path);
                }

                return true;
              })
              .map((file) => ({
                label: file.path,
                value: file,
              }))}
            onSubmit={(value) => {
              setState({ ...state, step: 4, specPath: value.path });
              onSubmit({
                owner: state.owner,
                repository: state.repository,
                source: "github",
                specPath: value.path,
              });
            }}
          />
        </Box>
      );
    case 4:
      return (
        <Box flexDirection="column" key="step-4">
          <Box>
            <Message>Owner?</Message>
            <Answer>{state.owner}</Answer>
          </Box>
          <Box>
            <Message>Repository?</Message>
            <Answer>{state.repository}</Answer>
          </Box>
          <Box>
            <Message>OpenAPI file?</Message>
            <Answer>{state.specPath}</Answer>
          </Box>
        </Box>
      );
  }
};
