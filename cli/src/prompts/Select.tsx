import { Box, Text, useInput } from "ink";
import React, { useState } from "react";
import { Answer } from "./Answer";
import { Message } from "./Message";

export type Choice<T> = {
  value: T;
  label: string;
};

export type SelectProps<TChoice> = {
  message: string;
  choices: Choice<TChoice>[];
  hint?: string;
  onSubmit: (value: TChoice) => void;
};

export function Select<TChoice>({
  message,
  choices,
  hint,
  onSubmit,
}: SelectProps<TChoice>) {
  const [selectedChoice, setSelectedChoice] = useState(0);
  const [answer, setAnswer] = useState<string>();

  useInput((input, key) => {
    if (key.downArrow) {
      setSelectedChoice((prev) => (prev + 1) % choices.length);
    }

    if (key.upArrow) {
      setSelectedChoice((prev) => {
        if (prev === 0) return choices.length - 1;
        return prev - 1;
      });
    }

    if (key.return) {
      setAnswer(choices[selectedChoice].label);
      onSubmit(choices[selectedChoice].value);
    }
  });

  return (
    <Box flexDirection={answer ? "row" : "column"}>
      <Message>{message}</Message>
      {answer ? (
        <Answer>{answer}</Answer>
      ) : (
        <Box flexDirection="column">
          {choices.map((choice, i) => (
            <Box key={`choice-${i}`}>
              <Box minWidth={2}>
                {i === selectedChoice && <Text color="cyan">{">"}</Text>}
              </Box>
              <Text>{choice.label}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
