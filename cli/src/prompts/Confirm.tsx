import { Box, Text } from "ink";
import React, { useState } from "react";

import { Message } from "./Message.js";
import TextInput from "./TextInput.js";

export type ConfirmProps = {
  message: string;
  defaultValue?: boolean;
  onSubmit: (value: boolean) => void;
};

export const Confirm = ({ message, defaultValue, onSubmit }: ConfirmProps) => {
  const [value, setValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [answer, setAnswer] = useState<boolean>();

  return (
    <>
      <Box>
        <Message>{message}</Message>
        <Box marginRight={1}>
          {typeof defaultValue === "boolean" ? (
            <Text>({defaultValue ? "Y/n" : "y/N"})</Text>
          ) : (
            <Text>(y/n)</Text>
          )}
        </Box>
        {answer !== undefined ? (
          <Text color={answer ? "green" : "red"}>{answer ? "Yes" : "No"}</Text>
        ) : (
          <TextInput
            onChange={(val) => {
              setIsValid(true);
              setValue(val);
            }}
            value={value}
            onSubmit={(val) => {
              if (typeof defaultValue === "boolean" && val === "") {
                setAnswer(defaultValue);
                onSubmit(defaultValue);
                return;
              }

              const result = valueToBoolean(val);
              if (result.valid) {
                setAnswer(result.value);
                onSubmit(result.value);
              } else {
                setIsValid(false);
              }
            }}
            showCursor={!answer}
          />
        )}
      </Box>
      {!isValid ? (
        <Text color="red">The answer need to be "Yes" or "No"!</Text>
      ) : null}
    </>
  );
};

const valueToBoolean = (
  input: string
): { valid: true; value: boolean } | { valid: false } => {
  const lowerInput = input.toLowerCase();
  if (lowerInput === "y" || lowerInput === "yes") {
    return { valid: true, value: true };
  }
  if (lowerInput === "n" || lowerInput === "no") {
    return { valid: true, value: false };
  }
  return { valid: false };
};
