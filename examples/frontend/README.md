# OpenAPI Codegen `github` example

## Getting started

To try the playground out for yourself, run the following commands:

```shell
git clone https://github.com/fabien0102/openapi-codegen.git
cd openapi-codegen/examples/frontend
npm install
npm run dev
```

You can play around with the example by removing the ./openapi-codegen.config.ts and ./src/github/ and run the following commands to generate these files on your own:

```shell
npx openapi-codegen init
npx openapi-codegen gen {namespace}
```

## References

You can find a detailed description of how to use openapi-codegen on https://xata.io/blog/openapi-typesafe-react-query-hooks
