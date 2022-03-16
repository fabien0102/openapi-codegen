import { pascal } from "case";

export const getContext = (prefix: string, componentsFile: string) =>
  `import type { QueryKey, UseQueryOptions } from "react-query";
  import { Operation } from './${componentsFile}';
  
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
    queryKeyFn: (operation: Operation) => reactQuery.QueryKey;
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
      queryKeyFn: queryKey => {
        switch (operation.operationId) {
          default: {
            const { pathParams, queryParams, body } = operation.variables;

            return [operation, pathParams, queryParams, body];
          }
        }
      },
    };
  };

  type KeyManager<T extends keyof typeof queryKeyManager> = NonNullable<Parameters<typeof queryKeyManager[T]>[0]> & {
    pathParams?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: unknown;
  };
  `;
