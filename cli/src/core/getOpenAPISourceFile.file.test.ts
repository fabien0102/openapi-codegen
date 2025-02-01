import { assert, describe, expect, it } from "vitest";
import { getOpenAPISourceFile } from "./getOpenAPISourceFile";

describe("getOpenAPISourceFile (source = file)", () => {
  it("should retrieve a local yaml file specs", async () => {
    const { text, format } = await getOpenAPISourceFile({
      source: "file",
      relativePath: "cli/src/fixtures/spec.yaml",
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

  it("should retrieve a local yml file specs", async () => {
    const { text, format } = await getOpenAPISourceFile({
      source: "file",
      relativePath: "cli/src/fixtures/spec.yml",
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

  it("should retrieve a local json file specs", async () => {
    const { text, format } = await getOpenAPISourceFile({
      source: "file",
      relativePath: "cli/src/fixtures/spec.json",
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

  it("should throw an error if the format is not yaml or json", async () => {
    try {
      await getOpenAPISourceFile({
        source: "file",
        relativePath: "cli/src/fixtures/spec.yolo",
      });
      assert.fail("Should throw an error");
    } catch (e) {
      expect(e).toMatchInlineSnapshot(
        `[Error: "yolo" extension file is not supported!]`,
      );
    }
  });
});
