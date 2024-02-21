import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

import { Answer } from "./Answer.js";
import { Hint } from "./Hint.js";
import { Message } from "./Message.js";
import { useStdoutRows } from "./useStdoutRows.js";

export type Choice<T> = {
  value: T;
  label: string;
  hint?: string;
};

export type SelectProps<TChoice> = {
  message?: string;
  choices: Choice<TChoice>[];
  onSubmit: (value: TChoice) => void;
};

export function Select<TChoice>({
  message,
  choices,
  onSubmit,
}: SelectProps<TChoice>) {
  const [arrowIndex, setArrowIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [answer, setAnswer] = useState<string>();
  const rows = useStdoutRows();
  const pageSize = rows - 1; // bit of margin to display the question

  useInput((_input, key) => {
    if (key.downArrow) {
      if (arrowIndex + 1 < Math.min(pageSize, choices.length))
        setArrowIndex((prev) => prev + 1);
      if (arrowIndex === pageSize - 1 && offset < choices.length - pageSize)
        setOffset((prev) => prev + 1);
    }

    if (key.upArrow) {
      if (arrowIndex > 0) setArrowIndex((prev) => prev - 1);
      if (arrowIndex === 0 && offset > 0) setOffset((prev) => prev - 1);
    }

    if (key.return) {
      const currentChoice = choices[arrowIndex + offset];
      console.clear(); // Avoid the choices list to leak on the next prompt
      setAnswer(currentChoice.label);
      onSubmit(currentChoice.value);
    }
  });

  const choiceMaxLength = choices
    .map((c) => c.label.length)
    .reduce((mem, i) => Math.max(mem, i), 0);

  return (
    <Box flexDirection={answer ? "row" : "column"}>
      {message && <Message>{message}</Message>}
      {answer ? (
        <Answer>{answer}</Answer>
      ) : (
        <Box flexDirection="column">
          {choices.slice(offset, offset + pageSize).map((choice, i) => (
            <Box key={`choice-${choice.label}`}>
              <Box minWidth={2}>
                {arrowIndex === i && <Text color="cyan">❯</Text>}
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
