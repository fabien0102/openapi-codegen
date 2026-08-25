import { describe, expect, it } from "vitest";
import { isValidIdentifier } from "./isValidIdentifier";

describe("isValidIdentifier", () => {
  it("accepts simple identifiers", () => {
    expect(isValidIdentifier("foo")).toBe(true);
    expect(isValidIdentifier("Foo")).toBe(true);
    expect(isValidIdentifier("_foo")).toBe(true);
    expect(isValidIdentifier("$foo")).toBe(true);
    expect(isValidIdentifier("foo_bar123")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(isValidIdentifier("")).toBe(false);
  });

  it("rejects identifiers starting with a digit", () => {
    expect(isValidIdentifier("1foo")).toBe(false);
  });

  it("rejects identifiers containing invalid characters", () => {
    expect(isValidIdentifier("foo-bar")).toBe(false);
    expect(isValidIdentifier("foo bar")).toBe(false);
    expect(isValidIdentifier("foo.bar")).toBe(false);
  });

  it("rejects reserved words", () => {
    expect(isValidIdentifier("class")).toBe(false);
    expect(isValidIdentifier("import")).toBe(false);
    expect(isValidIdentifier("enum")).toBe(false);
    expect(isValidIdentifier("true")).toBe(false);
    expect(isValidIdentifier("false")).toBe(false);
  });

  it("accepts capitalized reserved words", () => {
    expect(isValidIdentifier("Class")).toBe(true);
    expect(isValidIdentifier("True")).toBe(true);
  });

  // Only reserved in strict mode; TypeScript's scanner still tokenizes these
  // as plain identifiers, so tsutils' isValidIdentifier accepts them too.
  it("accepts strict-mode-only future reserved words", () => {
    expect(isValidIdentifier("let")).toBe(true);
    expect(isValidIdentifier("static")).toBe(true);
    expect(isValidIdentifier("private")).toBe(true);
    expect(isValidIdentifier("interface")).toBe(true);
    expect(isValidIdentifier("yield")).toBe(true);
  });
});
