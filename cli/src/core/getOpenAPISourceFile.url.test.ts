import { describe, expect, it } from "vitest";
import { getOpenAPISourceFile } from "./getOpenAPISourceFile";
import nock from "nock";

// Polyfill Promise.withResolvers for Node 20 environments (required by @mswjs/interceptors / nock 15)
if (typeof Promise.withResolvers === "undefined") {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

describe("getOpenAPISourceFile (source = url)", () => {
  it("should retrieve a json file specs", async () => {
    nock(
      "https://github.com/fabien0102/openapi-codegen/blob/main/cli/examples/petstore.json"
    )
      .get("")
      .replyWithFile(200, "cli/src/fixtures/spec.json");

    const { format, text } = await getOpenAPISourceFile({
      source: "url",
      method: "get",
      url: "https://github.com/fabien0102/openapi-codegen/blob/main/cli/examples/petstore.json",
    });

    expect(format).toBe("json");
    expect(text).toMatchInlineSnapshot(`
     "{
       "openapi": "3.0.2",
       "info": {
         "title": "API Title",
         "version": "1.0"
       },
       "servers": [
         {
           "url": "https://api.server.test/v1"
         }
       ],
       "paths": {
         "/test": {
           "get": {
             "responses": {
               "200": {
                 "description": "OK"
               }
             }
           }
         }
       }
     }
     "
    `);
  });

  it("should guess the format with search params", async () => {
    nock(
      "https://github.com/fabien0102/openapi-codegen/blob/main/cli/examples/petstore.yaml"
    )
      .get("?key=secret")
      .replyWithFile(200, "cli/src/fixtures/spec.yaml");

    const { format, text } = await getOpenAPISourceFile({
      source: "url",
      method: "get",
      url: "https://github.com/fabien0102/openapi-codegen/blob/main/cli/examples/petstore.yaml?key=secret",
    });

    expect(format).toBe("yaml");
    expect(text).toMatchInlineSnapshot(`
     "openapi: "3.0.2"
     info:
       title: API Title
       version: "1.0"
     servers:
       - url: https://api.server.test/v1
     paths:
       /test:
         get:
           responses:
             "200":
               description: OK
     "
    `);
  });
});
