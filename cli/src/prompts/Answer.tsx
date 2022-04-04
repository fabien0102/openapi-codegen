import { Text } from "ink";
import React from "react";

export type AnswerProps = {
  children: React.ReactNode;
};

/**
 * Display a validated answer.
 */
export const Answer = ({ children }: AnswerProps) => (
  <Text color="cyan">{children}</Text>
);
