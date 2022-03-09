import { Box, Text } from "ink";
import React from "react";

import { TextInput } from "./TextInput.js";
import { Answer } from "./Answer.js";
import { Hint } from "./Hint.js";
import { Message } from "./Message.js";

export type InputProps = {
  message: string;
  hint?: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
};

export const Input = ({
  message,
  hint,
  defaultValue,
  onSubmit,
}: InputProps) => {
  const [value, setValue] = React.useState("");
  const [answer, setAnswer] = React.useState<string>();
  const [isValid, setIsValid] = React.useState(true);

  return (
    <>
      <Box>
        <Message>{message}</Message>
        {defaultValue ? (
          <Box marginRight={1}>
            <Text>({defaultValue})</Text>
          </Box>
        ) : null}
        {answer ? (
          <Answer>{answer}</Answer>
        ) : (
          <TextInput
            onChange={(val) => {
              setIsValid(true);
              setValue(val);
            }}
            value={value}
            onSubmit={(val) => {
              if (val === "" && defaultValue) {
                setAnswer(defaultValue);
                onSubmit(defaultValue);
              } else if (val === "" && !defaultValue) {
                setIsValid(false);
              } else {
                setAnswer(val);
                onSubmit(val);
              }
            }}
            showCursor={!answer}
          />
        )}
        {!value && hint ? <Hint>{hint}</Hint> : null}
      </Box>
      {!isValid ? <Text color="red">The answer can’t be empty!</Text> : null}
    </>
  );
};
