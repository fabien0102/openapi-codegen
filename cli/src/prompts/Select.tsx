import { Box, Text, useInput } from "ink";
import React, { useState } from "react";
import { Answer } from "./Answer";
import { Hint } from "./Hint";
import { Message } from "./Message";

export type Choice<T> = {
  value: T;
  label: string;
  hint?: string;
};

export type SelectProps<TChoice> = {
  message: string;
  choices: Choice<TChoice>[];
  onSubmit: (value: TChoice) => void;
};

export function Select<TChoice>({
  message,
  choices,
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

  const choiceMaxLength = choices
    .map((c) => c.label.length)
    .reduce((mem, i) => Math.max(mem, i), 0);

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
              <Box minWidth={choiceMaxLength + 1}>
                <Text>{choice.label}</Text>
              </Box>
              {choice.hint ? <Hint>{choice.hint}</Hint> : null}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
