import ts from "typescript";
import { getCustomFetcher } from "./customFetcher";

describe("customFetcher", () => {
  it("should render the customFetcher", () => {
    const sourceFile = ts.createSourceFile(
      "index.ts",
      "",
      ts.ScriptTarget.Latest
    );

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });

    expect(
      getCustomFetcher("test")
        .map((node) =>
          printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
        )
        .join("\n")
    ).toMatchInlineSnapshot(`
      "import qs from \\"qs\\";
      export type TestFetcherOptions<TBody, THeaders, TQueryParams, TPathParams> = {
          url: string;
          method: string;
          body?: TBody;
          headers?: THeaders;
          queryParams?: TQueryParams;
          pathParams?: TPathParams;
      };
      export default async function testFetch<TData, TBody extends {} | undefined, THeaders extends {} | undefined | null, TQueryParams extends {} | undefined, TPathParams extends {} | undefined>({ url, method, body, headers, pathParams, queryParams }: TestFetcherOptions<TBody, THeaders, TQueryParams, TPathParams>): Promise<TData> {
          const response = await window.fetch(resolveUrl(url, queryParams, pathParams), {
              method,
              body: body ? JSON.stringify(body) : undefined,
              headers: {
                  \\"Content-Type\\": \\"application/json\\",
                  ...headers
              }
          });
          if (!response.ok) {
              throw new Error(\\"Network response was not ok\\");
          }
          return await response.json();
      }
      const resolveUrl = (url: string, queryParams: Record<string, unknown> = {}, pathParams: Record<string, string> = {}) => {
          let query = qs.stringify(queryParams);
          if (query)
              query = \`?\${query}\`;
          return url.replace(/\\\\{\\\\w*\\\\}/g, key => pathParams[key.slice(1, -1)]) + query;
      };"
    `);
  });
});
