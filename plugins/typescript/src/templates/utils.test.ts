import { it, describe, expect } from "vitest";

describe("deepMerge", () => {
  /* Playground to craft `deepMerge` */
  function deepMerge<T, U extends T>(target: T, source: U): U {
    const returnType = (target || {}) as U;
    for (const key in source) {
      if (source[key] instanceof Object)
        Object.assign(source[key], deepMerge(returnType[key], source[key]));
    }
    Object.assign(returnType || {}, source);
    return returnType;
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
