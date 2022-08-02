# OpenAPI Codegen typescript

Collection of typescript generators & utils

## Generators

### generateSchemaType

Generate all `#/components` types. This generator is the foundation of other generators.

This is returning `schemasFiles`, the list of generated files (needed as `config` for other generators).

### generateReactQueryComponents

Generate `useQuery` & `useMutation` wrapper from [react-query](https://react-query.tanstack.com/).

Example:

```ts
// openapi-codegen.config.ts

import { defineConfig } from "@openapi-codegen/cli";
import {
  generateReactQueryComponents,
  generateSchemaTypes,
} from "@openapi-codegen/typescript";

export default defineConfig({
  petstore: {
    from: {
      /* file, url or github */
    },
    outputDir: "./petStore",
    to: async (context) => {
      const filenamePrefix = "petStore";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
```

This generator will generate 3 files:

- `{filenamePrefix}Components.ts`
- `{filenamePrefix}Context.ts`
- `{filenamePrefix}Fetcher.ts`

Only `{filenamePrefix}Components.ts` can’t be manually touch and will be regenerate at every openAPI changes.

The `{filenamePrefix}Context.ts` can be tweak to inject any props in the generated hooks, this is an example with some auth flow.

```ts
// `PetStoreContext.ts`
import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";

export type PetStoreContext = {
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
export function usePetStoreContext<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryOptions?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    "queryKey" | "queryFn"
  >
): BadassContext {
  const token = window.localStorage.getItem("token");

  return {
    fetcherOptions: {
      headers: {
        authorization: token ? `Bearer ${token}` : undefined,
      },
    },
    queryOptions: {
      enabled: Boolean(token) && (queryOptions?.enabled ?? true),
    },
    queryKeyFn: (queryKey) => queryKey,
  };
}
```

You also need to tweak `{filenamePrefix}Fetcher.ts`, to inject your `baseUrl` and adjust the error management part to fullfil the `ErrorType` (you can search for the `TODO` keyword).

#### Usage

First of all, we need to have a working react-query context (more information [here](https://react-query.tanstack.com/quick-start)).

Now that we have all this generated code and properly configured `{filenamePrefix}Fetcher.ts` to talk to the correct server. This is time to try!

Assuming that you have a route with the verb `GET` and the `operationId` as `listPets`. You can simply use `useListPets` in a react component.

```tsx
import { useListPets } from "./petstoreComponents";

export const MyPage = () => {
  const { data, isLoading, error } = useListPets(["listPets"]); // <- You need to add the react-query cache key

  return <div>{JSON.stringify({ data, isLoading, error })}</div>;
};
```

And for any mutation.

```tsx
import { useUpdatePet } from "./pestoreComponents";

export const MyPage = () => {
  const { mutate: updatePet } = useUpdatePet();

  return (
    <button
      onClick={() =>
        updatePet({ pathParams: { id: "2" }, body: { name: "Biscuit" } })
      }
    >
      Give a cute name
    </button>
  );
};
```

### generateFetchers

Generate some generic fetchers, `{filenamePrefix}Fetcher.ts` can be customized to fit your needs.

`{filenamePrefix}Components.ts` will use this fetcher with the OpenAPI types passed as generic.

## Utils

### renameComponent

Rename a component name in openAPI document and all related $ref.

Example:

```ts
// openapi-codegen.config.ts

import { defineConfig } from "@openapi-codegen/cli";
import {
  generateReactQueryComponents,
  generateSchemaTypes,
  renameComponent,
} from "@openapi-codegen/typescript";

export default defineConfig({
  myAPI: {
    from: {
      /* file, url or github */
    },
    outputDir: "./myAPI",
    to: async (context) => {
      // Rename `Foo` to `Bar`
      context.openAPIDocument = renameComponent({
        openAPIDocument: context.openAPIDocument,
        from: "#/components/schemas/Foo",
        to: "#/components/schemas/Bar",
      });

      const filenamePrefix = "myAPI";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
```

### forceReactQueryComponent

Force the generation of a specific react-query hook.

Example:

```ts
// openapi-codegen.config.ts

import { defineConfig } from "@openapi-codegen/cli";
import {
  generateReactQueryComponents,
  generateSchemaTypes,
  renameComponent,
} from "@openapi-codegen/typescript";

export default defineConfig({
  myAPI: {
    from: {
      /* file, url or github */
    },
    outputDir: "./myAPI",
    to: async (context) => {
      // Force the usage of `useQuery` for listPets
      context.openAPIDocument = forceReactQueryComponent({
        openAPIDocument: contextOpenAPIDocument
        component: "useQuery",
        operationId: "listPets"
      })

      const filenamePrefix = "myAPI";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
```

## Custom OpenAPI extensions

| Property                    | Description                                         | Type                      |
| --------------------------- | --------------------------------------------------- | ------------------------- |
| x-openapi-codegen-component | Force the generation of a specific react-query hook | "useMutate" \| "useQuery" |
