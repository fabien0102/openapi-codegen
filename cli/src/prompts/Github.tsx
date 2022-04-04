import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

import { Box, Text } from "ink";
import fetch from "got-fetch";
import React from "react";

import type { GithubOptions } from "../types";

import { Message } from "./Message.js";
import {
  useSearchFileQuery,
  useSearchRepositoryQuery,
  useSearchUserQuery,
} from "./queries/github.js";
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
      query: (state.step === 2 && `${state.owner}/`) || "",
    },
    skip: state.step !== 2,
    client: apolloClient,
  });

  const {
    data: files,
    error: filesError,
    loading: filesLoading,
  } = useSearchFileQuery({
    variables: {
      expression:
        state.step === 3 && state.specPath ? `HEAD:${state.specPath}` : "HEAD:",
      owner: state.owner || "",
      repositoryName: (state.step === 3 && state.repository) || "",
    },
    skip: state.step !== 3,
    client: apolloClient,
  });

  if (!token) {
    return <GithubToken onSubmit={setToken} />;
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
        <Box flexDirection="column">
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
            <Answer>{state.specPath}/</Answer>
            <TextInput onChange={setSearch} value={search} />
          </Box>
          {filesError && <Box>{filesError}</Box>}
          {filesLoading && (
            <Text>
              <Spinner />
              Loading…
            </Text>
          )}
          {files &&
            files.repository?.object?.__typename === "Tree" &&
            files.repository.object.entries && (
              <Select
                choices={files.repository.object.entries
                  .filter((file) => {
                    if (search) {
                      return new RegExp(search, "i").exec(file.name);
                    }

                    return true;
                  })
                  .map((file) => ({
                    label: file.name,
                    value: file,
                  }))}
                onSubmit={(value) => {
                  setSearch("");
                  if (value.type === "blob") {
                    const specPath = `${
                      state.specPath ? state.specPath + "/" : ""
                    }${value.name}`;
                    setState({ ...state, step: 4, specPath });
                    onSubmit({
                      owner: state.owner,
                      repository: state.repository,
                      source: "github",
                      specPath,
                    });
                  } else if (value.type === "tree") {
                    setState({
                      ...state,
                      specPath: `${state.specPath ? state.specPath + "/" : ""}${
                        value.name
                      }`,
                    });
                  }
                }}
              />
            )}
        </Box>
      );
    case 4:
      return (
        <Box flexDirection="column">
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
