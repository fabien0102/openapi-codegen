import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";
import { Answer } from "./Answer";
import { Message } from "./Message";

type InputProps = {
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
  const [value, setValue] = useState("");
  const [answer, setAnswer] = useState<string>();
  const [isValid, setIsValid] = useState(true);

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
        {!value && hint ? (
          <Box marginLeft={1}>
            <Text color="blackBright">{hint}</Text>
          </Box>
        ) : null}
      </Box>
      {!isValid ? <Text color="red">The answer can’t be empty!</Text> : null}
    </>
  );
};
