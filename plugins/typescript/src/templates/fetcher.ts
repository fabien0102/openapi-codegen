import { camel, pascal } from "case";

/**
 * Get fetcher template
 *
 * @param contextPath import the context from another file
 */
export const getFetcher = (prefix: string, contextPath?: string) =>
  `import qs from "qs";
${
  contextPath
    ? `import { ${pascal(prefix)}Context } from "./${contextPath}";`
    : `
    
    export type ${pascal(prefix)}FetcherExtraProps = {
      /**
       * You can add some extra props to your generated fetchers.
       * 
       * Note: You need to re-gen after adding the first property to
       * have the \`${pascal(prefix)}FetcherExtraProps\` injected in \`${pascal(
        prefix
      )}Components.ts\`
       **/
    }`
}

export type ${pascal(
    prefix
  )}FetcherOptions<TBody, THeaders, TQueryParams, TPathParams> = {
  url: string;
  method: string;
  body?: TBody;
  headers?: THeaders;
  queryParams?: TQueryParams;
  pathParams?: TPathParams;
} & ${
    contextPath
      ? `${pascal(prefix)}Context["fetcherOptions"];`
      : `${pascal(prefix)}FetcherExtraProps`
  }

export async function ${camel(prefix)}Fetch<
  TData,
  TBody extends {} | undefined,
  THeaders extends {},
  TQueryParams extends {},
  TPathParams extends {}
>({
  url,
  method,
  body,
  headers,
  pathParams,
  queryParams,
}: ${pascal(prefix)}FetcherOptions<
  TBody,
  THeaders,
  TQueryParams,
  TPathParams
>): Promise<TData> {
  const response = await window.fetch(
    resolveUrl(url, queryParams, pathParams),
    {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

const resolveUrl = (
  url: string,
  queryParams: Record<string, unknown> = {},
  pathParams: Record<string, string> = {}
) => {
  let query = qs.stringify(queryParams);
  if (query) query = \`?\${query}\`;
  return url.replace(/\\{\\w*\\}/g, (key) => pathParams[key.slice(1, -1)]) + query;
};
`;
