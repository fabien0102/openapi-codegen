import { it, describe, expect } from "vitest";

describe("deepMerge", () => {
  /* Playground to craft `deepMerge` */
  function deepMerge<T>(target: T, source: T): T {
    for (const key in source) {
      if (source[key] instanceof Object)
        Object.assign(source[key], deepMerge(target[key], source[key]));
    }
    Object.assign(target || {}, source);
    return target;
  }
  /* End of playground */

  it("should merge two objects", () => {
    type fetcherOptions = {
      headers: { "x-custom"?: boolean; authorization: string };
      queryParams?: { media?: string };
    };

    const a: fetcherOptions = {
      headers: { "x-custom": true, authorization: "nope!" },
      queryParams: { media: "vite testing" },
    };
    const b: fetcherOptions = { headers: { authorization: "authorized!" } };

    expect(deepMerge(a, b)).toEqual({
      headers: {
        "x-custom": true,
        authorization: "authorized!",
      },
      queryParams: { media: "vite testing" },
    });
  });
});
