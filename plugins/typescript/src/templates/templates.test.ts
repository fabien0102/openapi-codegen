import prettier from "prettier";

import { getContext } from "./context";
import { getFetcher } from "./fetcher";

describe("context", () => {
  it("should be parsable by prettier", () => {
    const template = getContext("petstore", "./components");
    expect(() => {
      prettier.format(template, { parser: "babel-ts" });
    }).not.toThrow();
  });
});

describe("fetcher", () => {
  it("should be parsable by prettier", () => {
    const template = getFetcher({
      prefix: "petstore",
      contextPath: "./context",
    });
    expect(() => {
      prettier.format(template, { parser: "babel-ts" });
    }).not.toThrow();
  });
});
