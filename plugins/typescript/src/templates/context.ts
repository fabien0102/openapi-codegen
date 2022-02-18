import { pascal } from "case";

export const getContext = (prefix: string) =>
  `import type { QueryKey, UseQueryOptions } from "react-query";
  
  export type ${pascal(prefix)}Context = {
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
       * Set this to \`false\` to disable automatic refetching when the query mounts or changes query keys.
       * Defaults to \`true\`.
       */
      enabled?: boolean;
    };
    /**
     * Query key middleware.
     */
    queryKeyFn: (queryKey: QueryKey) => QueryKey;
  };
  
  /**
   * Context injected into every react-query hook wrappers
   * 
   * @param queryOptions options from the useQuery wrapper
   */
   export function use${pascal(prefix)}Context<
   TQueryFnData = unknown,
   TError = unknown,
   TData = TQueryFnData,
   TQueryKey extends QueryKey = QueryKey
 >(
   queryOptions?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
 ): ${pascal(prefix)}Context {
    return {
      fetcherOptions: {},
      queryOptions: {},
      queryKeyFn: queryKey => queryKey,
    };
  };
  `;
