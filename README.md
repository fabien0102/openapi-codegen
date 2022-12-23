<div align="center" style="margin-bottom: 16px">
  <img src="openapi-codegen-logo.svg" width="400px" />
</div>

[![npm](https://img.shields.io/npm/v/@openapi-codegen/cli.svg?style=for-the-badge)](https://www.npmjs.com/package/@openapi-codegen/cli)
[![License](https://img.shields.io/npm/l/@openapi-codegen/cli.svg?style=for-the-badge)](https://github.com/fabien0102/openapi-codegen/blob/main/LICENSE)

Tooling to give you full type-safety around OpenAPI specs.

- [Getting started](#getting-started)
- [Philosophy](#philosophy)
  - [Backend side](#backend-side)
  - [Frontend side](#frontend-side)
- [Configuration](#configuration)
  - [Config Options](#config-options)
    - [**filenamePrefix**](#filenameprefix)
    - [**filenameCase**](#filenamecase)
    - [**schemasFiles**](#schemasfiles)
    - [**injected header**](#injected-header)
  - [Example Config](#example-config)
  - [Plugins](#plugins)
    - [**generateSchemaTypes** (frontend/backend)](#generateschematypes-frontendbackend)
    - [**generateFetchers** (frontend)](#generatefetchers-frontend)
    - [**generateReactQueryComponents** (frontend)](#generatereactquerycomponents-frontend)
    - [**generateReactQueryFunctions** (frontend)](#generatereactqueryfunctions-frontend)
    - [**planned plugins**](#planned-plugins)
- [Contributors ✨](#contributors-)

**For frontend:**

This will give you full auto-completion and type-safety of your APIs

**For backend: (in coming)**

This will generate everything you need to deliver a perfect API, spec driven.

## Getting started

```bash
$ npm i -D @openapi-codegen/{cli,typescript}
$ npx openapi-codegen init
```

Follow the steps, this will generate a configuration file for you (openapi-codegen.config.ts).

You should have a bunch of types / components ready to be used.

Note: The generated `{namespace}Fetcher.ts` assume a global `fetch`, if you want to use this in a nodejs environment, please update this file (this is just a template)

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

Note: You can also attach any custom logic by using the `x-*` tag, the possibilities are endless!

### Frontend side

Having to reverse engineer a backend response is the least productive/fun task ever! However, given a nice OpenAPI specs, we can actually generate nicely typed code for you that lets you interact with your API in a safe manner.

Taking React as example, calling an API can be as simple as this:

```tsx
import { useListPets } from "./petStore/petStoreComponents"; // <- output from openapi-codegen

const App = () => {
  const { data, loading, error } = useListPets();

  // `data` is fully typed and have all documentation from OpenAPI
};
```

And since this generated from the specs, everything is safe at build time!

Note: If you can’t trust your backend, some runtime validation can be useful to avoid surprises in production 😅

## Configuration

The only thing you need to manage is the configuration.
Everything is typed and self-documented, but just in case, you can find here example configuration below:


### Config Options

A Plugin uses the `context` as first paramter and a `config` object as second optional Paramter.
The known config parameters are:
#### **filenamePrefix**

| optionName     | type   | default value | example    | output                    |
| -------------- | ------ | ------------- | ---------- | ------------------------- |
| filenamePrefix | string | ""            | yourPrefix | yourPrefix{PluginName}.ts |

```ts
const filenamePrefix = "yourPrefix"
await generate{PluginName}(context,{ filenamePrefix })

```
output to: `yourPrefix{PluginName}.ts`

#### **filenameCase**

| optionName   | type                                      | default value | example | output                       |
| ------------ | ----------------------------------------- | ------------- | ------- | ---------------------------- |
| filenameCase | "snake" \| "camel" \| "kebab" \| "pascal" | camel         | snake   | your-prefix-{plugin-name}.ts |

```ts
const filenameCase = "snake"
await generate{PluginName}(context,{ filenameCase })

```
output to: `{plugin-name}.ts`

#### **schemasFiles**

generated `schemasFiles` from `generateSchemaTypes`. can be used for all other generator plugins.

 ```ts
const { schemasFiles } = await generateSchemaTypes(context);
```
output to: `Schemas.ts`

#### **injected header**
  List of headers injected in the custom fetcher. 
  This will mark the header as optional in the component API
| injectedHeaders      | type     | default value | example | output |
| -------------------- | -------- | ------------- | ------- | ------ |
| *any header options* | string[] | []            | []      |        |

```ts
const injectedHeaders = 'credentials-include'
await generate{PluginName}(context,{ injectedHeaders })

```
output to: `{plugin-name}.ts`


### Example Config
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

### Plugins
the `@openapi-codegen/cli` supports these generator plugins:
#### **generateSchemaTypes** (frontend/backend)
  generate all schema types for your specification:
  ```ts
   const { schemasFiles } = await generateSchemaTypes(context, {
        /* config */
      });
  ```
output: `schemas.ts`

#### **generateFetchers** (frontend)
  generate all fetchers with types for your specification *needs schemafiles*
  ```ts
     await generateFetchers(context, {
        /* config */
        schemasFiles,
      });
  ```
output: `fetchers.ts`

#### **generateReactQueryComponents** (frontend)
  generate all React Query Components for useQuery() and useMutation()
  ```ts
      await generateReactQueryComponents(context, {
        /* config*/
        schemasFiles,
      });
  ```
  output: `components.ts`
#### **generateReactQueryFunctions** (frontend)
  generate all React Query Functions used for e.g. React-Router 6.6.0+ loader functions
  ```ts
     await generateReactQueryFunctions(context, {
        filenamePrefix,
        schemasFiles,
      });
  ```
  outout: `queryFunctions.ts`

  example useage in react-route-loader:
  ```ts
  export const routeLoader = (queryClient: QueryClient) =>
    async ({ params }: any) => 
      await queryClient.fetchQuery(...getYourQueryNameQuery({}), {
        /*options*/
      })
  ```
  *more infos: https://reactrouter.com/en/main/guides/data-libs*

#### **planned plugins**
- generateExpressControllers (Backend)
- generateRestfulReactComponents (Frontend)

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
      <td align="center"><a href="https://fabien0102.com/"><img src="https://avatars.githubusercontent.com/u/1761469?v=4?s=100" width="100px;" alt="Fabien BERNARD"/><br /><sub><b>Fabien BERNARD</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=fabien0102" title="Code">💻</a> <a href="#design-fabien0102" title="Design">🎨</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=fabien0102" title="Documentation">📖</a> <a href="#ideas-fabien0102" title="Ideas, Planning, & Feedback">🤔</a> <a href="#projectManagement-fabien0102" title="Project Management">📆</a> <a href="https://github.com/fabien0102/openapi-codegen/pulls?q=is%3Apr+reviewed-by%3Afabien0102" title="Reviewed Pull Requests">👀</a></td>
      <td align="center"><a href="https://github.com/mpotomin"><img src="https://avatars.githubusercontent.com/u/639406?v=4?s=100" width="100px;" alt="mpotomin"/><br /><sub><b>mpotomin</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=mpotomin" title="Code">💻</a> <a href="#ideas-mpotomin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/fabien0102/openapi-codegen/pulls?q=is%3Apr+reviewed-by%3Ampotomin" title="Reviewed Pull Requests">👀</a></td>
      <td align="center"><a href="https://github.com/micha-f"><img src="https://avatars.githubusercontent.com/u/200647?v=4?s=100" width="100px;" alt="Michael Franzkowiak"/><br /><sub><b>Michael Franzkowiak</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=micha-f" title="Documentation">📖</a></td>
      <td align="center"><a href="https://github.com/SferaDev"><img src="https://avatars.githubusercontent.com/u/2181866?v=4?s=100" width="100px;" alt="Alexis Rico"/><br /><sub><b>Alexis Rico</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=SferaDev" title="Code">💻</a> <a href="#ideas-SferaDev" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center"><a href="https://ned.im/"><img src="https://avatars.githubusercontent.com/u/271912?v=4?s=100" width="100px;" alt="Nedim Arabacı"/><br /><sub><b>Nedim Arabacı</b></sub></a><br /><a href="#question-needim" title="Answering Questions">💬</a> <a href="https://github.com/fabien0102/openapi-codegen/commits?author=needim" title="Code">💻</a> <a href="#ideas-needim" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center"><a href="https://github.com/antoniel"><img src="https://avatars.githubusercontent.com/u/17225358?v=4?s=100" width="100px;" alt="Antoniel Magalhães"/><br /><sub><b>Antoniel Magalhães</b></sub></a><br /><a href="#example-antoniel" title="Examples">💡</a></td>
      <td align="center"><a href="https://github.com/DreierF"><img src="https://avatars.githubusercontent.com/u/5631865?v=4?s=100" width="100px;" alt="Florian Dreier"/><br /><sub><b>Florian Dreier</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=DreierF" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://fabianalthaus.de"><img src="https://avatars.githubusercontent.com/u/2795534?v=4?s=100" width="100px;" alt="Fabian Althaus [el-j]"/><br /><sub><b>Fabian Althaus [el-j]</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=el-j" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
