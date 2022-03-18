import React from "react";
import { Box, Text } from "ink";

type MessageProps = {
  children: string;
};

/**
 * Display a question to the user.
 */
export const Message = ({ children }: MessageProps) => (
  <Box flexDirection="row">
    <Box marginRight={1}>
      <Text color="green">?</Text>
    </Box>
    <Box marginRight={1}>
      <Text bold>{children}</Text>
    </Box>
  </Box>
);
