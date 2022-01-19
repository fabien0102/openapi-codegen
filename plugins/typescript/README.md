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
  myAPI: {
    from: {
      /* file, url or github */
    },
    outputDir: "./myAPI",
    to: async (context) => {
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

This generator will generate 3 files:

- `{filenamePrefix}Components.ts`
- `{filenamePrefix}Context.ts`
- `{filenamePrefix}Fetcher.ts`

Only `{filenamePrefix}Components.ts` can’t be manually touch and will be regenerate at every openAPI changes.

The `{filenamePrefix}Context.ts` can be tweak to inject any props in the generated hooks, this is an example with some auth flow.

```ts
// `BadassContext.ts`

export type BadassContext = {
  fetcherOptions: {
    /**
     * Headers to inject in the fetcher
     */
    headers?: {
      authorization?: string;
    };
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
};

/**
 * Context injected into every react-query hook wrappers
 */
export const useBadassContext = (): BadassContext => {
  const token = window.localStorage.getItem("token");
  return {
    fetcherOptions: {
      headers: {
        authorization: token ? `Bearer ${token}` : undefined,
      },
    },
    queryOptions: {
      enabled: Boolean(token),
    },
  };
};
```

You can also tweak `{filenamePrefix}Fetcher.ts`, especially the error management part, so everything fit the expected `ErrorType`.

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
