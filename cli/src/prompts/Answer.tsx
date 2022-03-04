import { Text } from "ink";
import React from "react";

export type AnswerProps = {
  children: string;
};

/**
 * Display a validated answer.
 */
export const Answer = ({ children }: AnswerProps) => (
  <Text color="cyan">{children}</Text>
);
