import { describe, expect, it } from "vitest";

import { isValidIdentifier } from "./isValidIdentifier";

describe("isValidIdentifier", () => {
  it("accepts valid identifiers", () => {
    expect(isValidIdentifier("foo")).toBe(true);
    expect(isValidIdentifier("_foo")).toBe(true);
    expect(isValidIdentifier("$foo")).toBe(true);
    expect(isValidIdentifier("名前")).toBe(true);
  });

  it("rejects keywords and invalid identifiers", () => {
    expect(isValidIdentifier("class")).toBe(false);
    expect(isValidIdentifier("default")).toBe(false);
    expect(isValidIdentifier("123")).toBe(false);
    expect(isValidIdentifier("a-b")).toBe(false);
    expect(isValidIdentifier("foo.bar")).toBe(false);
  });
});
