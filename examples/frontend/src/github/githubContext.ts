import type {
  DefaultError,
  Enabled,
  QueryKey,
  UseQueryOptions,
} from "@tanstack/react-query";
import { QueryOperation } from "./githubComponents";

export type GithubContext<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  fetcherOptions: {
    /**
     * Headers to inject in the fetcher
     */
    headers?: {};
    /**
     * Query params to inject in the fetcher
     */
    queryParams?: {};
  };
  queryOptions: {
    /**
     * Set this to `false` to disable automatic refetching when the query mounts or changes query keys.
     * Defaults to `true`.
     */
    enabled?: Enabled<TQueryFnData, TError, TQueryFnData, TQueryKey>;
  };
};

/**
 * Context injected into every react-query hook wrappers
 *
 * @param queryOptions options from the useQuery wrapper
 */
export function useGithubContext<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  _queryOptions?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    "queryKey" | "queryFn"
  >
): GithubContext<TQueryFnData, TError, TData, TQueryKey> {
  return {
    fetcherOptions: {},
    queryOptions: {},
  };
}

export const queryKeyFn = (operation: QueryOperation) => {
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

// Helpers
const resolvePathParam = (key: string, pathParams: Record<string, string>) => {
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
  return "variables" in operation && "pathParams" in operation.variables;
};

const hasBody = (
  operation: QueryOperation
): operation is QueryOperation & {
  variables: { body: Record<string, unknown> };
} => {
  return "variables" in operation && "body" in operation.variables;
};

const hasQueryParams = (
  operation: QueryOperation
): operation is QueryOperation & {
  variables: { queryParams: Record<string, unknown> };
} => {
  return "variables" in operation && "queryParams" in operation.variables;
};
