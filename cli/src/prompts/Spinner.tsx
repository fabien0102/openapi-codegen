import React from "react";
import { useState, useEffect } from "react";
import { Text } from "ink";

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Spinner
 */
export const Spinner = () => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        const isLastFrame = previousFrame === frames.length - 1;
        return isLastFrame ? 0 : previousFrame + 1;
      });
    }, 80);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return <Text color="green">{frames[frame]} </Text>;
};
