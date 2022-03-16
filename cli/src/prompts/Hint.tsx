import React from "react";
import { Box, Text } from "ink";

export type HintProps = {
  children: string;
};

/**
 * Display a hint to the user.
 */
export const Hint = ({ children }: HintProps) => (
  <Box marginLeft={1}>
    <Text color="blackBright">{children}</Text>
  </Box>
);
