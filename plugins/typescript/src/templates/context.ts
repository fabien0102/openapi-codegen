import { pascal } from "case";

export const getContext = (prefix: string) =>
  `export type ${pascal(prefix)}Context = {
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
  };
  
  /**
   * Context injected into every react-query hook wrappers
   */
  export const use${pascal(prefix)}Context = (): ${pascal(prefix)}Context => {
    return {
      fetcherOptions: {},
      queryOptions: {},
    };
  };
  `;
