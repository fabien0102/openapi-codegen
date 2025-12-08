import type { MediaTypeObject } from "openapi3-ts/oas30";
import { describe, expect, it } from "vitest";
import { findCompatibleMediaType } from "./findCompatibleMediaType";

describe("findCompatibleMediaType", () => {
  it("should return undefined if content is empty", () => {
    expect(findCompatibleMediaType({ content: {} })).toBeUndefined();
  });

  it("should return MediaTypeObject for application/json", () => {
    const mediaTypeObject: MediaTypeObject = { schema: { type: "object" } };
    const result = findCompatibleMediaType({
      content: {
        "application/json": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for application/json with charset", () => {
    const mediaTypeObject: MediaTypeObject = {
      schema: { type: "object" },
    };
    const result = findCompatibleMediaType({
      content: {
        "application/json; charset=utf-8": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for */*", () => {
    const mediaTypeObject: MediaTypeObject = {
      schema: { type: "string" },
    };
    const result = findCompatibleMediaType({
      content: {
        "*/*": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for application/octet-stream", () => {
    const mediaTypeObject: MediaTypeObject = {
      schema: { type: "string", format: "binary" },
    };
    const result = findCompatibleMediaType({
      content: {
        "application/octet-stream": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for multipart/form-data", () => {
    const mediaTypeObject: MediaTypeObject = {
      schema: {
        type: "object",
        properties: {
          file: { type: "string", format: "binary" },
        },
      },
    };
    const result = findCompatibleMediaType({
      content: {
        "multipart/form-data": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for text/csv", () => {
    const mediaTypeObject: MediaTypeObject = {
      schema: { type: "string" },
    };
    const result = findCompatibleMediaType({
      content: {
        "text/csv": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for text/csv with charset", () => {
    const mediaTypeObject: MediaTypeObject = {
      schema: { type: "string" },
    };
    const result = findCompatibleMediaType({
      content: {
        "text/csv; charset=utf-8": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return undefined for unsupported media type", () => {
    const result = findCompatibleMediaType({
      content: {
        "text/html": { schema: { type: "string" } },
      },
    });
    expect(result).toBeUndefined();
  });

  it("should return the first compatible media type when multiple are present", () => {
    const jsonMediaType: MediaTypeObject = {
      schema: { type: "object" },
    };
    const csvMediaType: MediaTypeObject = {
      schema: { type: "string" },
    };
    const result = findCompatibleMediaType({
      content: {
        "text/html": { schema: { type: "string" } },
        "application/json": jsonMediaType,
        "text/csv": csvMediaType,
      },
    });
    expect(result).toBeDefined();
    expect([jsonMediaType, csvMediaType]).toContain(result);
  });
});
