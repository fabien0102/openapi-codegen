// Fork from `ink-text-input` package
// https://github.com/vadimdemedes/ink-text-input

import React, { useState, useEffect } from "react";
import type { FC } from "react";
import { Text, useInput } from "ink";
import chalk from "chalk";

interface Props {
  /**
   * Text to display when `value` is empty.
   */
  placeholder?: string;

  /**
   * Listen to user's input. Useful in case there are multiple input components
   * at the same time and input must be "routed" to a specific component.
   */
  focus?: boolean;

  /**
   * Replace all chars and mask the value. Useful for password inputs.
   */
  mask?: string;

  /**
   * Whether to show cursor and allow navigation inside text input with arrow keys.
   */
  showCursor?: boolean;

  /**
   * Highlight pasted text
   */
  highlightPastedText?: boolean;

  /**
   * Value to display in a text input.
   */
  value: string;

  /**
   * Function to call when value updates.
   */
  onChange: (value: string) => void;

  /**
   * Function to call when `Enter` is pressed, where first argument is a value of the input.
   */
  onSubmit?: (value: string) => void;
}

const TextInput: FC<Props> = ({
  value: originalValue,
  placeholder = "",
  focus = true,
  mask,
  highlightPastedText = false,
  showCursor = true,
  onChange,
  onSubmit,
}) => {
  const [{ cursorOffset, cursorWidth }, setState] = useState({
    cursorOffset: (originalValue || "").length,
    cursorWidth: 0,
  });

  useEffect(() => {
    setState((previousState) => {
      if (!focus || !showCursor) {
        return previousState;
      }

      const newValue = originalValue || "";

      if (previousState.cursorOffset > newValue.length - 1) {
        return {
          cursorOffset: newValue.length,
          cursorWidth: 0,
        };
      }

      return previousState;
    });
  }, [originalValue, focus, showCursor]);

  const cursorActualWidth = highlightPastedText ? cursorWidth : 0;

  const value = mask ? mask.repeat(originalValue.length) : originalValue;
  let renderedValue = value;
  let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

  // Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
  if (showCursor && focus) {
    renderedPlaceholder =
      placeholder.length > 0
        ? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
        : chalk.inverse(" ");

    renderedValue = value.length > 0 ? "" : chalk.inverse(" ");

    let i = 0;

    for (const char of value) {
      if (i >= cursorOffset - cursorActualWidth && i <= cursorOffset) {
        renderedValue += chalk.inverse(char);
      } else {
        renderedValue += char;
      }

      i++;
    }

    if (value.length > 0 && cursorOffset === value.length) {
      renderedValue += chalk.inverse(" ");
    }
  }

  useInput(
    (input, key) => {
      if (
        key.upArrow ||
        key.downArrow ||
        (key.ctrl && input === "c") ||
        key.tab ||
        (key.shift && key.tab)
      ) {
        return;
      }

      if (key.return) {
        if (onSubmit) {
          onSubmit(originalValue);
        }

        return;
      }

      let nextCursorOffset = cursorOffset;
      let nextValue = originalValue;
      let nextCursorWidth = 0;

      if (key.leftArrow) {
        if (showCursor) {
          nextCursorOffset--;
        }
      } else if (key.rightArrow) {
        if (showCursor) {
          nextCursorOffset++;
        }
      } else if (key.backspace || key.delete) {
        if (cursorOffset > 0) {
          nextValue =
            originalValue.slice(0, cursorOffset - 1) +
            originalValue.slice(cursorOffset, originalValue.length);

          nextCursorOffset--;
        }
      } else {
        nextValue =
          originalValue.slice(0, cursorOffset) +
          input +
          originalValue.slice(cursorOffset, originalValue.length);

        nextCursorOffset += input.length;

        if (input.length > 1) {
          nextCursorWidth = input.length;
        }
      }

      if (cursorOffset < 0) {
        nextCursorOffset = 0;
      }

      if (cursorOffset > originalValue.length) {
        nextCursorOffset = originalValue.length;
      }

      setState({
        cursorOffset: nextCursorOffset,
        cursorWidth: nextCursorWidth,
      });

      if (nextValue !== originalValue) {
        onChange(nextValue);
      }
    },
    { isActive: focus }
  );

  return (
    <Text>
      {placeholder
        ? value.length > 0
          ? renderedValue
          : renderedPlaceholder
        : renderedValue}
    </Text>
  );
};

export default TextInput;

interface UncontrolledProps extends Omit<Props, "value" | "onChange"> {
  /**
   * Initial value.
   */
  initialValue?: string;
}

export const UncontrolledTextInput: FC<UncontrolledProps> = ({
  initialValue = "",
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  return <TextInput {...props} value={value} onChange={setValue} />;
};
