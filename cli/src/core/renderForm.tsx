import React from "react";
import { render, useApp } from "ink";

type InferProps<T> = T extends React.ComponentType<infer P> ? P : never;

export type SubmitInjectedComponent<
  T,
  C = React.ComponentType
> = React.ComponentType<InferProps<C> & { onSubmit: (value: T) => void }>;

export async function renderForm<T, C = React.ComponentType>(
  UserComponent: SubmitInjectedComponent<T, C>,
  props: InferProps<C>
) {
  let returnedValue: T | undefined;

  const App = () => {
    const { exit } = useApp();

    const onSubmit = (value: T) => {
      returnedValue = value;
      exit();
    };

    return <UserComponent {...props} onSubmit={onSubmit} />;
  };

  const { waitUntilExit } = render(<App />);

  await waitUntilExit();

  return returnedValue;
}
