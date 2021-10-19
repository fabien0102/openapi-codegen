# OpenAPI Codegen

⚠️ This project is in early stage, please check the issues to see what’s is missing! ⚠️

-> Insert logo and badges here

Tooling to give you full type-safety around OpenAPI specs.

**For frontend:**

This will give you full auto-completion and type-safety of your APIs

**For backend:**

This will generate you everything to be able to deliver a perfect API, spec driven.

## Getting started

```bash
$ npx @openapi-codegen/cli init
```

Follow the steps, this will generate you a configuration file (openapi-codegen.config.ts) and update your `package.json`

```bash
$ yarn gen # or the defined alias
```

You should have a bunch of types / components ready to be used.

## Philosophy

In software development, the harder part is usually communication and more specifically documentation.

GraphQL did resolve this by having documentation part of the tooling (introspection), sadly this is often harder with REST API. OpenAPI can be an amazing tool, if, and if only the documentation and the actual implementation are aligned!

### Backend side

For this, we have two viable options from the backend perspective:

1. The OpenAPI is generated from the code (code first)
2. The code is generated from OpenAPI (spec first)

And this need to be linked to the type system of the language, so everything is connected, and we remove or update something that impact the final response, this is **automatically** reflected!

This library is to support the second option, spec first. By doing so, your documentation is not your last boring task on the list, but the first exiting one! Indeed, you can’t start coding without generating your types (models & controllers) from the specs.

This have few benefits:

- You can take your time to think about your API before writing any code!
- You can discuss the API with your team (and discover API design problem earlier)
- You can generate all your validation rules

As example, if you write this object in your schema:

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

OpenAPI Codegen will be able to generate all the relevant validation (or at least give you the choice to do it)

Note: You can also attach any custom logic with `x-*` tag, the possibilities are endless!

### Frontend side

Having to reverse engineer a backend response is the least productive/fun task ever! This is why, with some nice OpenAPI specs, we can actually generate some nice types components.

Taking React as example, calling an API will be as simple as this:

```tsx
import { useListPets } from "petStore"; // <- output from openapi-codegen

const App = () => {
  const { data, loading, error } = useListPets();

  // `data` is fully typed and have all documentation from OpenAPI
};
```

And since this generated from the specs, everything is safe at build time!

Note: If you can’t trust your backend, some runtime validation can be useful to avoid surprise in production 😅

## Configuration

The only thing you need to manage is the configuration.
Everything is typed and self documented, but just in case, you can find here an example configuration.

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
      branch: "main",
      specPath: "examples/spec.yaml",
    },

    // can be overridden from cli
    outputDir: "src",

    to: async (context: {
      openAPIDocument: OpenAPIObject;
      operationsTree: OperationTree;
      outputDir: string;
      customFlags: Record<string, unknown>; // extra flags from the cli
    }) => {
      // You can transform the `openAPIDocument` here, can be useful to remove internal routes or fixing some known issues in the specs ;)

      // Generate all the schemas types (components & responses)
      await generateSchemaTypes(context, {
        /* config */
      });

      // Generate all react-query components
      await generateReactQueryComponents(context, {
        /* config*/
      });
    },
  },
});
```

You can import any generator into the `to` section, those can be provided by us or you, you have the full control of what you are generating!

Have fun!

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/mpotomin"><img src="https://avatars.githubusercontent.com/u/639406?v=4?s=100" width="100px;" alt=""/><br /><sub><b>mpotomin</b></sub></a><br /><a href="https://github.com/fabien0102/openapi-codegen/commits?author=mpotomin" title="Code">💻</a> <a href="#ideas-mpotomin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/fabien0102/openapi-codegen/pulls?q=is%3Apr+reviewed-by%3Ampotomin" title="Reviewed Pull Requests">👀</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
