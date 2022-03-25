import React, { useEffect, useState } from "react";
import { Observable } from "rxjs";
import { Box } from "ink";
import { Input, InputProps } from "./Input.js";
import { Select, SelectProps } from "./Select.js";
import { Confirm, ConfirmProps } from "./Confirm.js";
import { Github, GithubProps } from "./Github.js";
import { GithubToken, GithubTokenProps } from "./GithubToken.js";
import {
  GithubPullRequest,
  GithubPullRequestProps,
} from "./GithubPullRequest.js";

export type PromptUnit =
  | ({ type: "input" } & InputProps)
  | ({ type: "select" } & SelectProps<any>)
  | ({ type: "confirm" } & ConfirmProps)
  | ({ type: "github" } & GithubProps)
  | ({ type: "githubToken" } & GithubTokenProps)
  | ({ type: "githubPullRequest" } & GithubPullRequestProps);

type AppProps = {
  state: Observable<PromptUnit>;
};

export function App({ state }: AppProps) {
  const [prompts, setPrompts] = useState<PromptUnit[]>([]);

  useEffect(() => {
    const sub = state.subscribe((p) => {
      setPrompts((prev) => [...prev, p]);
    });

    return () => sub.unsubscribe();
  }, [state]);

  if (prompts.length > 0) {
    return (
      <Box flexDirection="column">
        {prompts.map((promptProps, index) => {
          switch (promptProps.type) {
            case "input":
              return <Input {...promptProps} key={index} />;
            case "select":
              return <Select {...promptProps} key={index} />;
            case "confirm":
              return <Confirm {...promptProps} key={index} />;
            case "github":
              return <Github {...promptProps} key={index} />;
            case "githubToken":
              return <GithubToken {...promptProps} key={index} />;
            case "githubPullRequest":
              return <GithubPullRequest {...promptProps} key={index} />;
          }
        })}
      </Box>
    );
  }

  return null;
}
