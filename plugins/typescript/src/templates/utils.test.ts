import { it, describe, expect } from "vitest";

describe("deepMerge", () => {
  /* Playground to craft `deepMerge` */
  function isMergeableObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      (value.constructor === Object || value.constructor === undefined)
    );
  }

  function deepMerge<T, U extends T>(target: T, source: U): U {
    const result = { ...(target || {}) } as U;
    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = result[key];
      result[key] =
        isMergeableObject(targetValue) && isMergeableObject(sourceValue)
          ? (deepMerge(targetValue, sourceValue) as U[Extract<keyof U, string>])
          : sourceValue;
    }
    return result;
  }
  /* End of playground */

  type fetcherOptions = {
    headers: { "x-custom"?: boolean; authorization: string };
    queryParams?: { media?: string };
  };

  it("should merge two objects", () => {
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

  type variables = {
    headers?: { "x-custom"?: boolean; authorization?: string };
    body?: Record<string, unknown>;
  };

  it("should not mutate the target", () => {
    const target: variables = {
      headers: { "x-custom": true, authorization: "nope!" },
    };

    deepMerge(target, { headers: { authorization: "authorized!" } });

    expect(target).toEqual({
      headers: { "x-custom": true, authorization: "nope!" },
    });
  });

  it("should not mutate the source", () => {
    const target: variables = { headers: { "x-custom": true } };
    const source: variables = { headers: { authorization: "authorized!" } };

    deepMerge(target, source);

    expect(source).toEqual({ headers: { authorization: "authorized!" } });
  });

  it("should replace arrays instead of merging them by index", () => {
    expect(deepMerge({ ids: [1, 2, 3] }, { ids: [9] })).toEqual({ ids: [9] });
  });

  it("should not merge into non-plain objects", () => {
    const body = new FormData();
    body.append("file", "content");

    expect(deepMerge({ body: new FormData() }, { body }).body).toBe(body);
  });

  it("should not leak state between calls sharing a target", () => {
    const fetcherOptions: variables = {
      headers: { authorization: "authorized!" },
    };

    const first = deepMerge(fetcherOptions, {
      body: { title: "first", archivedAt: "2026-01-01" },
    });
    const second = deepMerge(fetcherOptions, {
      body: { title: "second" },
    });

    expect(first.body).toEqual({ title: "first", archivedAt: "2026-01-01" });
    expect(second.body).toEqual({ title: "second" });
  });
});
