import React from "react";
import { render } from "ink";
import { ReplaySubject } from "rxjs";

import type { GithubOptions } from "src/types";

import { Choice } from "./Select.js";
import { App, PromptUnit } from "./App.js";

export type InputOptions = {
  message: string;
  hint?: string;
  defaultValue?: string;
};

export type ConfirmOptions = {
  message: string;
  defaultValue?: boolean;
};

export type SelectOptions<TChoice> = {
  choices: Choice<TChoice>[];
  message: string;
  hint?: string;
};

export class Prompt {
  private state = new ReplaySubject<PromptUnit>();

  /**
   * Ink render instance.
   */
  private app = render(<App state={this.state} />);

  /**
   * Close the prompt session.
   */
  public close() {
    this.app.clear();
    this.app.unmount();
  }

  /**
   * Ask a question to the user.
   *
   * @example
   * const name = await prompt.input("What’s your name?")
   */
  public input(message: string): Promise<string>;
  public input(options: InputOptions): Promise<string>;
  public input(options: InputOptions | string): Promise<string> {
    const props = typeof options === "string" ? { message: options } : options;

    return new Promise<string>((resolve) => {
      this.state.next({
        type: "input",
        onSubmit: resolve,
        ...props,
      });
    });
  }

  /**
   * Show a list of options to the user.
   *
   * @example
   * const gender = await prompt.select({
   *   choices: [
   *    { label: "Male", value: "m" as const },
   *    { label: "Female", value: "f" as const }
   *   ],
   *   message: "What’s your gender?"
   * })
   */
  public select<TChoice>(props: SelectOptions<TChoice>): Promise<TChoice> {
    return new Promise<TChoice>((resolve) => {
      this.state.next({
        type: "select",
        onSubmit: resolve,
        ...props,
      });
    });
  }

  /**
   * Ask a question with yes or no expected answer.
   *
   * @example
   * const withSauce = await prompt.confirm("Do you want sauce?")
   */
  public confirm(message: string): Promise<boolean>;
  public confirm(options: ConfirmOptions): Promise<boolean>;
  public confirm(options: ConfirmOptions | string): Promise<boolean> {
    const props = typeof options === "string" ? { message: options } : options;

    return new Promise<boolean>((resolve) => {
      this.state.next({
        type: "confirm",
        onSubmit: resolve,
        ...props,
      });
    });
  }

  /**
   * Smart prompt for selecting a github file.
   */
  public github(token: string): Promise<GithubOptions> {
    return new Promise<GithubOptions>((resolve) => {
      this.state.next({
        type: "github",
        token,
        onSubmit: resolve,
      });
    });
  }

  /**
   * Retrieve github token. This will ask if the token is not already stored.
   */
  public githubToken(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.state.next({
        type: "githubToken",
        onSubmit: resolve,
      });
    });
  }
}
