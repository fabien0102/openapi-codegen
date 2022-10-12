<div align="center" style="margin-bottom: 16px">
  <img src="openapi-codegen-logo.svg" width="400px" />
</div>

[![npm](https://img.shields.io/npm/v/@openapi-codegen/cli.svg?style=for-the-badge)](https://www.npmjs.com/package/@openapi-codegen/cli)
[![License](https://img.shields.io/npm/l/@openapi-codegen/cli.svg?style=for-the-badge)](https://github.com/fabien0102/openapi-codegen/blob/main/LICENSE)

Tooling to give you full type-safety around OpenAPI specs.

### You can generate
- TypeScript types
- Type-safe Generic Fetchers
- Type-safe React Query hooks (https://github.com/tanstack/query) [*this option also generates the fetchers*]


**For frontend:**

This will give you full auto-completion and type-safety of your APIs

**For backend: (in coming)**

This will generate everything you need to deliver a perfect API, spec driven.

## Getting started

1. **Initialize the generator**

    ```bash
    $ npx @openapi-codegen/cli init
    ```
    
    If you wish to change any of the selections made, you can do so in the generated `openapi-codegen.config.ts` file.

2. **Generate the API access code**

    ```bash
    $ npx openapi-codegen gen {namespace}
    ```

    After the code generation is done you will notice the following files:
    
    - `{namespace}Fetcher.ts` - defines a function that will make requests to your API.
    - `{namespace}Context.tsx` - the context that provides `{namespace}Fetcher` to other components.
    - `{namespace}Components.tsx` - generated React Query components (if you selected React Query as part of initialization). 
    - `{namespace}Schemas.ts` - the generated Typescript types from the provided Open API schemas.
    
    &nbsp;
    > **Warning**
    > If `{namespace}Fetcher.ts` or `{namespace}Context.tsx` already exist in the output folder, they will not be replaced. However, `{namespace}Components.tsx` and `{namespace}Schemas.ts` will be re-generated each time based on the Open API spec file provided.

3. **Configure the Fetcher** (optional)

    After the first step you should see a file called `{namespace}Fetcher.ts` in your ouput directory. This file 
    
    By default it uses the built-in Fetch API, you are free to change this to your fetching library of choice (Axios, Got etc.)

    If your Open API spec contains a configured server, then the base URL for all requests will default to that server's URL. If no such configuration exists, you'll need to specify the base URL value.

4. **Install and Configure React Query** (optional)

    If during generator setup you picked `> React Query components`, then you will need to install and configure React Query in order for the generated React hooks to work properly:

    - Install the library
      ```bash
      npm i @tanstack/react-query
      ```
    - Wire up the `QueryClient` as described [here](https://tanstack.com/query/v4/docs/adapters/react-query).
## Philosophy

In software development, communication between components and documentation around it is often no fun.

GraphQL did resolve this by making documentation a part of the tooling (introspection), sadly this is often harder with REST APIs. OpenAPI can be an amazing tool, if, and only if the documentation (spec) and the actual implementation are aligned!

### Backend side

There are two different approaches:

1. The OpenAPI spec is generated from the code (**code first**)
2. The code is generated from the OpenAPI spec (**spec first**)

In either case, there needs to be an integration with the type system of the language, so everything is connected, and as we remove or update something that impacts the final response, this is **automatically** reflected!

This library has chosen the second approach, **spec first**. By doing so, your documentation is not your final (boring) task on the list, but the first and exciting one when adding new functionality! Indeed, you can’t start coding without generating your types (models & controllers) from the specs.

This has multiple benefits:

- You can take your time to think about your API before writing any code!
- You can discuss the API with your team (and discover API design problems earlier)
- You can generate all your validation rules

For example, if you add this object to your schema:

```yaml
SignUpInput:
  type: object
  properties:
    email:
      type: string
      format: email
      maxLength: 255
    password:
      type: string
      maxLength: 255
    firstName:
      type: string
      pattern: ^[0-9a-zA-Z]*$
      maxLength: 255
    lastName:
      type: string
      pattern: ^[0-9a-zA-Z]*$
      maxLength: 255
  required:
    - email
    - password
    - firstName
    - lastName
```

OpenAPI Codegen will be able to generate all the relevant validation (or at least give you the choice to do it).

> **Note**
> You can also attach any custom logic by using the `x-*` tag, the possibilities are endless!

### Frontend side

Having to reverse engineer a backend response is the least productive/fun task ever! However, given a nice OpenAPI specs, we can actually generate nicely typed code for you that lets you interact with your API in a safe manner.

Taking React as example, calling an API can be as simple as this: *(this hooks are using **Tanstack Query** under the hood)*


```tsx
import { useListPets } from "./petStore/petStoreComponents"; // <- output from openapi-codegen

const Example = () => {
  const { data, loading, error } = useListPets();

  // `data` is fully typed and have all documentation from OpenAPI
};
```

> **Note**
> You can also check this blog post about using generated hooks in React https://xata.io/blog/openapi-typesafe-react-query-hooks

And since this generated from the specs, everything is safe at build time!

> **Note**
> If you can’t trust your backend, some runtime validation can be useful to avoid surprises in production 😅

## Configuration

The only thing you need to manage is the configuration.
Everything is typed and self-documented, but just in case, you can find here example configuration below:

```ts
// openapi-codegen.config.ts
import { defineConfig } from "@openapi-codegen/cli";
import {
  generateSchemaTypes,
  generateReactQueryComponents,
  /* generateExpressControllers, */
  /* generateRestfulReactComponents, */
  /* ... */
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

You can import any generator into the `to` section, those can be the ones provided by this project or your own custom ones. You have full control of what you are generating!

Have fun!

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://fabien0102.com/"><img src="https://avatars.githubusercontent.com/u/1761469?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Fabien BERNARD</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=fabien0102" title="Code">💻</a> <a href="#design-fabien0102" title="Design">🎨</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=fabien0102" title="Documentation">📖</a> <a href="#ideas-fabien0102" title="Ideas, Planning, & Feedback">🤔</a> <a href="#projectManagement-fabien0102" title="Project Management">📆</a> <a href="https://github.com/fabien0102/openapi-codegen/pulls?q=is%3Apr+reviewed-by%3Afabien0102" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/mpotomin"><img src="https://avatars.githubusercontent.com/u/639406?v=4?s=100" width="100px;" alt=""/><br /><sub><b>mpotomin</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=mpotomin" title="Code">💻</a> <a href="#ideas-mpotomin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/fabien0102/openapi-codegen/pulls?q=is%3Apr+reviewed-by%3Ampotomin" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/micha-f"><img src="https://avatars.githubusercontent.com/u/200647?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Michael Franzkowiak</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=micha-f" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/SferaDev"><img src="https://avatars.githubusercontent.com/u/2181866?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alexis Rico</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=SferaDev" title="Code">💻</a> <a href="#ideas-SferaDev" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://ned.im/"><img src="https://avatars.githubusercontent.com/u/271912?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nedim Arabacı</b></sub></a><br /><a href="#question-needim" title="Answering Questions">💬</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=needim" title="Code">💻</a> <a href="#ideas-needim" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/antoniel"><img src="https://avatars.githubusercontent.com/u/17225358?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Antoniel Magalhães</b></sub></a><br /><a href="#example-antoniel" title="Examples">💡</a></td>
    <td align="center"><a href="https://github.com/DreierF"><img src="https://avatars.githubusercontent.com/u/5631865?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Florian Dreier</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=DreierF" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
