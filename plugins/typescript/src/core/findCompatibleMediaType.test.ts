import { describe, expect, it } from "vitest";
import { findCompatibleMediaType } from "./findCompatibleMediaType";

describe("findCompatibleMediaType", () => {
  it("should return undefined if content is empty", () => {
    expect(findCompatibleMediaType({ content: {} })).toBeUndefined();
  });

  it("should return MediaTypeObject for application/json", () => {
    const mediaTypeObject = { schema: { type: "object" as const } };
    const result = findCompatibleMediaType({
      content: {
        "application/json": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for application/json with charset", () => {
    const mediaTypeObject = { schema: { type: "object" as const } };
    const result = findCompatibleMediaType({
      content: {
        "application/json; charset=utf-8": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for */*", () => {
    const mediaTypeObject = { schema: { type: "string" as const } };
    const result = findCompatibleMediaType({
      content: {
        "*/*": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for application/octet-stream", () => {
    const mediaTypeObject = {
      schema: { type: "string" as const, format: "binary" },
    };
    const result = findCompatibleMediaType({
      content: {
        "application/octet-stream": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for multipart/form-data", () => {
    const mediaTypeObject = {
      schema: {
        type: "object" as const,
        properties: {
          file: { type: "string" as const, format: "binary" },
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
    const mediaTypeObject = { schema: { type: "string" as const } };
    const result = findCompatibleMediaType({
      content: {
        "text/csv": mediaTypeObject,
      },
    });
    expect(result).toBe(mediaTypeObject);
  });

  it("should return MediaTypeObject for text/csv with charset", () => {
    const mediaTypeObject = { schema: { type: "string" as const } };
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
        "text/html": { schema: { type: "string" as const } },
      },
    });
    expect(result).toBeUndefined();
  });

  it("should return the first compatible media type when multiple are present", () => {
    const jsonMediaType = { schema: { type: "object" as const } };
    const csvMediaType = { schema: { type: "string" as const } };
    const result = findCompatibleMediaType({
      content: {
        "text/html": { schema: { type: "string" as const } },
        "application/json": jsonMediaType,
        "text/csv": csvMediaType,
      },
    });
    expect(result).toBeDefined();
    expect([jsonMediaType, csvMediaType]).toContain(result);
  });
});
