import { it, describe, expect } from "vitest";

// mock of @tanstack/react-query
const skipToken = Symbol("skip token");
type SkipToken = typeof skipToken;
type QueryKey = unknown[];

describe("queryKeyFn", () => {
  /* Playground to craft `queryKeyFn` & its helpers */
  const queryKeyFn = (operation: QueryOperation): QueryKey => {
    const queryKey: unknown[] = hasPathParams(operation)
      ? operation.path
          .split("/")
          .filter(Boolean)
          .map((i) => resolvePathParam(i, operation.variables.pathParams))
      : operation.path.split("/").filter(Boolean);

    if (hasQueryParams(operation)) {
      queryKey.push(operation.variables.queryParams);
    }

    if (hasBody(operation)) {
      queryKey.push(operation.variables.body);
    }

    return queryKey;
  };

  const resolvePathParam = (
    key: string,
    pathParams: Record<string, string>
  ) => {
    if (key.startsWith("{") && key.endsWith("}")) {
      return pathParams[key.slice(1, -1)];
    }
    return key;
  };

  const hasPathParams = (
    operation: QueryOperation
  ): operation is QueryOperation & {
    variables: { pathParams: Record<string, string> };
  } => {
    if (operation.variables === skipToken) return false;
    return "variables" in operation && "pathParams" in operation.variables;
  };

  const hasBody = (
    operation: QueryOperation
  ): operation is QueryOperation & {
    variables: { body: Record<string, unknown> };
  } => {
    if (operation.variables === skipToken) return false;
    return "variables" in operation && "body" in operation.variables;
  };

  const hasQueryParams = (
    operation: QueryOperation
  ): operation is QueryOperation & {
    variables: { queryParams: Record<string, unknown> };
  } => {
    if (operation.variables === skipToken) return false;
    return "variables" in operation && "queryParams" in operation.variables;
  };
  /* End of playground */

  type TestCase = {
    operation: QueryOperation;
    expected: unknown[];
  };

  const tests: TestCase[] = [
    {
      operation: {
        operationId: "randomGif",
        path: "/gifs/random",
        variables: {},
      },
      expected: ["gifs", "random"],
    },
    {
      operation: {
        operationId: "getGifById",
        path: "/gifs/{gifId}",
        variables: {
          pathParams: {
            gifId: "id",
          },
        },
      },
      expected: ["gifs", "id"],
    },
    {
      operation: {
        operationId: "randomSticker",
        path: "/stickers/random",
        variables: {
          body: {
            foo: "id",
            bar: 42,
          },
        },
      },
      expected: ["stickers", "random", { foo: "id", bar: 42 }],
    },
    {
      operation: {
        operationId: "searchGifs",
        path: "/gifs/search",
        variables: {
          queryParams: {
            q: "awesome",
          },
        },
      },
      expected: ["gifs", "search", { q: "awesome" }],
    },
  ];

  tests.forEach(({ operation, expected }) => {
    it(`should generate the correct key for ${operation.operationId}`, () => {
      expect(queryKeyFn(operation)).toEqual(expected);
    });
  });
});

// Types generated from giphy openAPI for testing
type QueryOperation =
  | {
      path: "/gifs/search";
      operationId: "searchGifs";
      variables: { queryParams: { q: string } } | SkipToken;
    }
  | {
      path: "/gifs/trending";
      operationId: "trendingGifs";
      variables: Record<string, never> | SkipToken;
    }
  | {
      path: "/gifs/translate";
      operationId: "translateGif";
      variables: Record<string, never> | SkipToken;
    }
  | {
      path: "/gifs/random";
      operationId: "randomGif";
      variables: Record<string, never> | SkipToken;
    }
  | {
      path: "/gifs/{gifId}";
      operationId: "getGifById";
      variables: { pathParams: { gifId: string } } | SkipToken;
    }
  | {
      path: "/gifs";
      operationId: "getGifsById";
      variables: Record<string, never> | SkipToken;
    }
  | {
      path: "/stickers/search";
      operationId: "searchStickers";
      variables: { queryParams: { q: string } } | SkipToken;
    }
  | {
      path: "/stickers/trending";
      operationId: "trendingStickers";
      variables: Record<string, never> | SkipToken;
    }
  | {
      path: "/stickers/translate";
      operationId: "translateSticker";
      variables: { queryParams: { s: string } } | SkipToken;
    }
  | {
      path: "/stickers/random";
      operationId: "randomSticker";
      variables: { body: { foo: string; bar: number } } | SkipToken;
    };
