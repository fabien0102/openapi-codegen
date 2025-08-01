<br>
<br>
<br>
<div align="center" style="margin-bottom: 16px">
  <img src="openapi-codegen-logo.svg" width="400px" />
</div>
<br>
<br>

  <div align="center">
    <a href="https://www.npmjs.com/package/@openapi-codegen/cli">
      <img alt="npm" src="https://img.shields.io/npm/v/@openapi-codegen/cli.svg?style=for-the-badge">
    </a>
    <a href="https://github.com/fabien0102/openapi-codegen/blob/main/LICENCE.md">
      <img alt="Read the documentation" src="https://img.shields.io/npm/l/@openapi-codegen/cli.svg?style=for-the-badge">
    </a>
<br>
<br>
    Tooling to give you full type-safety around OpenAPI specs.
  
  </div>

<br>

### You can generate

- TypeScript types
- Type-safe Generic Fetchers
- Type-safe React Query hooks (https://github.com/tanstack/query)

## Getting started

1. **Initialize the generator**

   ```bash
   npx @openapi-codegen/cli init
   ```

   <img style="max-width: 400px" src="https://user-images.githubusercontent.com/271912/194000679-5a4501b8-5fc0-430c-9217-028bf91a5dcd.gif">

   If you wish to change any of the selections made, you can do so in the generated `openapi-codegen.config.ts` file later..

2. **Start Generation**

   ```bash
   npx openapi-codegen gen {namespace}
   ```

   After the code generation is done, you will notice the following files:

   - `{namespace}Fetcher.ts` - defines a function that will make requests to your API.
   - `{namespace}Context.tsx` - the context that provides `{namespace}Fetcher` to other components.
   - `{namespace}Components.tsx` - generated React Query components (if you selected React Query as part of initialization).
   - `{namespace}Schemas.ts` - the generated Typescript types from the provided Open API schemas.

   &nbsp;

   > **Warning**
   >
   > If `{namespace}Fetcher.ts` or `{namespace}Context.tsx` already exist in the output folder, they will not be replaced. However, `{namespace}Components.tsx` and `{namespace}Schemas.ts` will be re-generated each time based on the Open API spec file provided.

3. **Configure the Fetcher** (optional)

   After the first step you should see a file called `{namespace}Fetcher.ts` in your ouput directory. This file

   By default it uses the built-in Fetch API, you are free to change this to your fetching library of choice (Axios, Got etc.)

   If your Open API spec contains a configured server, then the base URL for all requests will default to that server's URL. If no such configuration exists, you'll need to specify the base URL value.

4. **Install and Configure React Query** (optional)

   If during generator setup you picked `> React Query components`, then you will need to install and configure React Query in order for the generated React hooks to work properly:

   - [Install the React Query library](https://tanstack.com/query/latest/docs/framework/react/installation)
   - [Wire up the QueryClientProvider component](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider) to connect and provide a QueryClient to your application

## Usage

### React Query components

Using [giphy specs](https://api.apis.guru/v2/specs/giphy.com/1.0/openapi.yaml) as example

This will generate lot of ready-to-use hooks like:

- `useRandomGif` -> Wrapper around `useQuery` with injected types
- `useSuspenseRandomGif` -> Same but with `useSuspense`

And you will have some `useMutation` if the api expose some (not the case with this example)

Here an example of usage of this generated api:

```tsx
import { useRandomGif } from "./giphy";

export function GifExplorer() {
  const [tag, setTag] = useState("");
  const { data, error, isError, isPending } = useRandomGif({
    queryParams: {
      tag,
    },
  });

  return (
    <div>
      <input value={tag} onChange={(e) => setTag(e.currentTarget.value)} />
      {isPending ? (
        <div>Loading…</div>
      ) : isError ? (
        <div>
          <pre>{error.payload ?? "Unknown error"}</pre>
        </div>
      ) : (
        // This is typed!
        <img src={data.data?.url} />
      )}
    </div>
  );
}
```

This also support `reactQuery.skipToken` to stay type-safe when you are waiting for params:

```diff
+ import { skipToken } from "@tanstack/react-query";

- const { data, error, isError, isPending } = useRandomGif({
-     queryParams: {
-       tag,
-     },
-   });
+ const { data, error, isError, isPending } = useRandomGif(
+     tag
+       ? skipToken
+       : {
+           queryParams: {
+             tag,
+           },
+         }
+   );
```

You can also use directly the queryFn for more advanced use cases:

```tsx
import { randomGifQuery } from "./giphy/giphyComponents";

const queryClient = new QueryClient();

queryClient.fetchQuery(randomGifQuery({}));
```

## Configuration

The only thing you need to manage is the configuration.
Everything is typed and self-documented, but just in case, you can find here example configuration below:

### Example Config

```ts
// openapi-codegen.config.ts
import { defineConfig } from "@openapi-codegen/cli";
import {
  generateSchemaTypes,
  generateReactQueryComponents,
} from "@openapi-codegen/typescript";

export default defineConfig({
  example: {
    // can be overridden from cli
    from: {
      source: "github",
      owner: "fabien0102",
      repository: "openapi-codegen",
      ref: "main",
      specPath: "examples/spec.yaml",
    },

    // can be overridden from cli
    outputDir: "src/queries",

    to: async (context) => {
      // You can transform the `context.openAPIDocument` here, can be useful to remove internal routes or fixing some known issues in the specs ;)

      // Generate all the schemas types (components & responses)
      const { schemasFiles } = await generateSchemaTypes(context, {
        /* config */
      });

      // Generate all react-query components
      await generateReactQueryComponents(context, {
        /* config*/
        schemasFiles,
      });
    },
  },
});
```

### Plugins

the `@openapi-codegen/cli` supports these generator plugins:

#### **generateSchemaTypes** (frontend/backend)

generate all schema types for your specification:

```ts
const { schemasFiles } = await generateSchemaTypes(context, {
  /* config */
});
```

output: `{namespace}Schemas.ts`

#### **generateFetchers** (frontend)

generate all fetchers with types for your specification

```ts
await generateFetchers(context, {
  /* config */
  schemasFiles,
});
```

output: `{namespace}Fetchers.ts`

#### **generateReactQueryComponents** (frontend)

generate all React Query Components for useQuery() and useMutation()

```ts
await generateReactQueryComponents(context, {
  /* config*/
  schemasFiles,
});
```

output: `{namespace}Components.ts`

This is also generate a query function that can be used in most of React Query functions.

Example with `queryClient.fetchQuery` (data loader case):

```ts
await queryClient.fetchQuery(getYourQueryNameQuery({}));
```

You can import any generator into the `to` section, those can be the ones provided by this project or your own custom ones. You have full control of what you are generating!

Have fun!

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://fabien0102.com/"><img src="https://avatars.githubusercontent.com/u/1761469?v=4?s=100" width="100px;" alt="Fabien BERNARD"/><br /><sub><b>Fabien BERNARD</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=fabien0102" title="Code">💻</a> <a href="#design-fabien0102" title="Design">🎨</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=fabien0102" title="Documentation">📖</a> <a href="#ideas-fabien0102" title="Ideas, Planning, & Feedback">🤔</a> <a href="#projectManagement-fabien0102" title="Project Management">📆</a> <a href="https://github.com/fabien0102/openapi-codegen/pulls?q=is%3Apr+reviewed-by%3Afabien0102" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mpotomin"><img src="https://avatars.githubusercontent.com/u/639406?v=4?s=100" width="100px;" alt="mpotomin"/><br /><sub><b>mpotomin</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=mpotomin" title="Code">💻</a> <a href="#ideas-mpotomin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/fabien0102/openapi-codegen/pulls?q=is%3Apr+reviewed-by%3Ampotomin" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/micha-f"><img src="https://avatars.githubusercontent.com/u/200647?v=4?s=100" width="100px;" alt="Michael Franzkowiak"/><br /><sub><b>Michael Franzkowiak</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=micha-f" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SferaDev"><img src="https://avatars.githubusercontent.com/u/2181866?v=4?s=100" width="100px;" alt="Alexis Rico"/><br /><sub><b>Alexis Rico</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=SferaDev" title="Code">💻</a> <a href="#ideas-SferaDev" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ned.im/"><img src="https://avatars.githubusercontent.com/u/271912?v=4?s=100" width="100px;" alt="Nedim Arabacı"/><br /><sub><b>Nedim Arabacı</b></sub></a><br /><a href="#question-needim" title="Answering Questions">💬</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=needim" title="Code">💻</a> <a href="#ideas-needim" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/antoniel"><img src="https://avatars.githubusercontent.com/u/17225358?v=4?s=100" width="100px;" alt="Antoniel Magalhães"/><br /><sub><b>Antoniel Magalhães</b></sub></a><br /><a href="#example-antoniel" title="Examples">💡</a> <a href="https://github.com/fabien0102/openapi-codegen/issues?q=author%3Aantoniel" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/DreierF"><img src="https://avatars.githubusercontent.com/u/5631865?v=4?s=100" width="100px;" alt="Florian Dreier"/><br /><sub><b>Florian Dreier</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=DreierF" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://fabianalthaus.de"><img src="https://avatars.githubusercontent.com/u/2795534?v=4?s=100" width="100px;" alt="Fabian Althaus"/><br /><sub><b>Fabian Althaus</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=el-j" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ci-vamp"><img src="https://avatars.githubusercontent.com/u/116516277?v=4?s=100" width="100px;" alt="ci-vamp"/><br /><sub><b>ci-vamp</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/issues?q=author%3Aci-vamp" title="Bug reports">🐛</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=ci-vamp" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://twitter.com/oalanoliv"><img src="https://avatars.githubusercontent.com/u/4368481?v=4?s=100" width="100px;" alt="Alan Oliveira"/><br /><sub><b>Alan Oliveira</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=alan-oliv" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Cellule"><img src="https://avatars.githubusercontent.com/u/4157103?v=4?s=100" width="100px;" alt="Michael &quot;Mike&quot; Ferris"/><br /><sub><b>Michael &quot;Mike&quot; Ferris</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=Cellule" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rajzik"><img src="https://avatars.githubusercontent.com/u/10364836?v=4?s=100" width="100px;" alt="Jan Šilhan"/><br /><sub><b>Jan Šilhan</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/issues?q=author%3Arajzik" title="Bug reports">🐛</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=rajzik" title="Code">💻</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=rajzik" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dan-cooke"><img src="https://avatars.githubusercontent.com/u/22816887?v=4?s=100" width="100px;" alt="Daniel Cooke"/><br /><sub><b>Daniel Cooke</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/issues?q=author%3Adan-cooke" title="Bug reports">🐛</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=dan-cooke" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Kusmeroglu"><img src="https://avatars.githubusercontent.com/u/1638544?v=4?s=100" width="100px;" alt="Linden Wright"/><br /><sub><b>Linden Wright</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=Kusmeroglu" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://tverdohleb.com/"><img src="https://avatars.githubusercontent.com/u/172711?v=4?s=100" width="100px;" alt="Valeriy"/><br /><sub><b>Valeriy</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/issues?q=author%3Atverdohleb" title="Bug reports">🐛</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=tverdohleb" title="Code">💻</a> <a href="#ideas-tverdohleb" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
