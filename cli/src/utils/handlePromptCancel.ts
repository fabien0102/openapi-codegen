import { isCancel, cancel } from "@clack/prompts";

/**
 * Handle the cancellation case for clark’s prompts.
 *
 * @example
 * import { text } from "@clark/prompts"
 *
 * const input = await text({ message: "What’s up?!" }).then(handlePromptCancel)
 * // -> `input` is a `string`
 * @param value Any value coming from a cancellable clark prompt
 * @returns
 */
export async function handlePromptCancel<T>(value: T | symbol) {
  if (isCancel(value)) {
    cancel("Operation cancelled! See you later 😁✌️");
    process.exit(0);
  }
  return value;
}
