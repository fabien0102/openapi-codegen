import { request } from "@octokit/request";
import { GithubOptions } from "../types";

export type PullRequest = {
  ref: string;
  owner: string;
  repository: string;
};

export async function resolveGithubPullRequest({
  pullRequestNumber,
  token,
  options,
}: {
  pullRequestNumber: number;
  token: string;
  options: GithubOptions;
}): Promise<PullRequest> {
  const pullRequest = await request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      pull_number: pullRequestNumber,
      owner: options.owner,
      repo: options.repository,
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );

  return {
    owner: pullRequest.data.head.repo.owner.login,
    ref: pullRequest.data.head.ref,
    repository: pullRequest.data.head.repo.name,
  };
}
