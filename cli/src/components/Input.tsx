import { Box, render, Text, useApp } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";

type InputProps = {
  message: string;
  hint?: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
};

const Input = ({ message, hint, defaultValue, onSubmit }: InputProps) => {
  const [value, setValue] = useState("");
  const [answered, setAnswered] = useState(false);

  return (
    <Box>
      <Box marginRight={1}>
        <Text color="green">?</Text>
      </Box>
      <Box marginRight={1}>
        <Text bold>{message}</Text>
      </Box>
      {defaultValue ? (
        <Box marginRight={1}>
          <Text>({defaultValue})</Text>
        </Box>
      ) : null}
      {answered ? (
        <Text color="cyan">{value || defaultValue}</Text>
      ) : (
        <TextInput
          onChange={setValue}
          value={value}
          onSubmit={(val) => {
            setAnswered(true);
            onSubmit(val);
          }}
          showCursor={!answered}
        />
      )}
      {!value && hint ? (
        <Box marginLeft={1}>
          <Text color="blackBright">{hint}</Text>
        </Box>
      ) : null}
    </Box>
  );
};

/**
 * Ask a simple question to the user.
 *
 * @param message Question to ask
 * @returns User’s answer
 */
export const askQuestion = async (
  message: string,
  options: { hint?: string; defaultValue?: string } = {}
) => {
  let answer: string | undefined = options.defaultValue;

  const App = () => {
    const { exit } = useApp();

    const onSubmit = (value: string) => {
      if (value) answer = value;
      exit();
    };
    return <Input message={message} onSubmit={onSubmit} {...options} />;
  };

  const { waitUntilExit } = render(<App />);

  await waitUntilExit();

  return answer;
};
