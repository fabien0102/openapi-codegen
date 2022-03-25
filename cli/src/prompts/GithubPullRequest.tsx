import Apollo from "@apollo/client";

import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import fetch from "got-fetch";

import { useSearchPullRequestQuery } from "./queries/github.js";
import { Message } from "./Message.js";
import { Select } from "./Select.js";
import { TextInput } from "./TextInput.js";
import { Confirm } from "./Confirm.js";

const { ApolloClient, HttpLink, InMemoryCache } = Apollo;

export type PullRequest = {
  branch: string;
  owner: string;
  repository: string;
};

export type GithubPullRequestProps = {
  /**
   * If provided, the prompt will just resolve the branch name without asking anything else.
   */
  pullRequestNumber?: number;
  token: string;
  repository: string;
  owner: string;
  onSubmit: (head: PullRequest) => void;
};

export const GithubPullRequest = ({
  token,
  repository,
  pullRequestNumber,
  owner,
  onSubmit,
}: GithubPullRequestProps) => {
  const [search, setSearch] = useState("");

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

  const { data, error, loading } = useSearchPullRequestQuery({
    variables: {
      owner,
      repositoryName: repository,
    },
    client: apolloClient,
  });

  useEffect(() => {
    if (pullRequestNumber && data?.repository?.pullRequests.nodes) {
      const pr = data.repository.pullRequests.nodes.find(
        (node) => node?.number === pullRequestNumber
      );
      if (pr) {
        onSubmit({
          branch: pr.headRefName,
          owner: pr.headRepository?.owner.login ?? owner,
          repository: pr.headRepository?.name ?? repository,
        });
      }
    }
  }, [data, pullRequestNumber]);

  if (pullRequestNumber) {
    const pr = data?.repository?.pullRequests.nodes?.find(
      (node) => node?.number === pullRequestNumber
    );
    if (loading) return <Text>Resolving pull request…</Text>;
    if (!pr)
      return <Text>The pull request #{pullRequestNumber} is not open</Text>;
    return null;
  }

  if (data?.repository?.pullRequests.nodes?.length === 0) {
    return (
      <Box flexDirection="column">
        <Confirm
          message={`No open pull request found, do you want to fallback on "${data.repository.defaultBranchRef?.name}" branch?`}
          onSubmit={(answer) => {
            if (answer === true && data?.repository?.defaultBranchRef?.name) {
              onSubmit({
                owner,
                repository,
                branch: data.repository.defaultBranchRef?.name,
              });
            } else {
              process.exit(0);
            }
          }}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Message>Pull request title</Message>
        <TextInput onChange={setSearch} value={search} />
      </Box>
      {loading && <Text>Loading…</Text>}
      {error && <Box>{error.message}</Box>}
      {data && data.repository?.pullRequests.nodes && (
        <Select
          choices={data.repository.pullRequests.nodes
            .filter((node) =>
              search === ""
                ? true
                : new RegExp(search, "i").exec(
                    `#${node?.number} ${node?.title}` || ""
                  )
            )
            .slice(-10)
            .map((node) => ({
              label: `#${node?.number} ${node?.title}`,
              value: {
                owner: node?.headRepository?.owner.login || owner,
                repository: node?.headRepository?.name || repository,
                branch: node?.headRefName || "main",
              },
            }))}
          onSubmit={onSubmit}
        />
      )}
    </Box>
  );
};
