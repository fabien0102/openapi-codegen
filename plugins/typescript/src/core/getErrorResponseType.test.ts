import { ResponseObject } from "openapi3-ts";
import { print } from "../testUtils";
import { getErrorResponseType } from "./getErrorResponseType";

describe("getErrorResponseType", () => {
  it("should generate a simple error", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            "200": createResponse("Success"),
            "500": createResponse("SimpleError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: 500;
          payload: Schemas.SimpleError;
      }>"
    `);
  });

  it("should combine multiple errors", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            "404": createResponse("NotFoundError"),
            "500": createResponse("SimpleError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: 404;
          payload: Schemas.NotFoundError;
      } | {
          status: 500;
          payload: Schemas.SimpleError;
      }>"
    `);
  });

  it("should generate undefined if no error provided", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {},
          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toEqual("Fetcher.ErrorWrapper<undefined>");
  });

  it("should deal with default rule", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            default: createResponse("SimpleError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: ClientErrorStatus | ServerErrorStatus;
          payload: Schemas.SimpleError;
      }>"
    `);
  });

  it("should deal with default rule (with 4xx)", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            "4xx": createResponse("ClientError"),
            default: createResponse("DefaultError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: ClientErrorStatus;
          payload: Schemas.ClientError;
      } | {
          status: ServerErrorStatus;
          payload: Schemas.DefaultError;
      }>"
    `);
  });

  it("should deal with default rule (with 5xx)", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            "5xx": createResponse("ServerError"),
            default: createResponse("DefaultError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: ServerErrorStatus;
          payload: Schemas.ServerError;
      } | {
          status: ClientErrorStatus;
          payload: Schemas.DefaultError;
      }>"
    `);
  });

  it("should deal with 4xx rule", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            422: createResponse("ValidationError"),
            "4xx": createResponse("ClientError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: 422;
          payload: Schemas.ValidationError;
      } | {
          status: Exclude<ClientErrorStatus, 422>;
          payload: Schemas.ClientError;
      }>"
    `);
  });

  it("should deal with 5xx rule", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            501: createResponse("NotImplementedError"),
            503: createResponse("NotAvailableError"),
            "5xx": createResponse("ServerError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: 501;
          payload: Schemas.NotImplementedError;
      } | {
          status: 503;
          payload: Schemas.NotAvailableError;
      } | {
          status: Exclude<ServerErrorStatus, 501 | 503>;
          payload: Schemas.ServerError;
      }>"
    `);
  });

  it("should deal with a mix of all rules", () => {
    expect(
      print(
        getErrorResponseType({
          responses: {
            422: createResponse("ValidationError"),
            501: createResponse("NotImplementedError"),
            503: createResponse("NotAvailableError"),
            "5xx": createResponse("ServerError"),
            default: createResponse("DefaultError"),
          },

          printNodes: (nodes) => nodes.map(print).join("\n"),
        })
      )
    ).toMatchInlineSnapshot(`
      "Fetcher.ErrorWrapper<{
          status: 422;
          payload: Schemas.ValidationError;
      } | {
          status: 501;
          payload: Schemas.NotImplementedError;
      } | {
          status: 503;
          payload: Schemas.NotAvailableError;
      } | {
          status: Exclude<ServerErrorStatus, 501 | 503>;
          payload: Schemas.ServerError;
      } | {
          status: Exclude<ClientErrorStatus, 422>;
          payload: Schemas.DefaultError;
      }>"
    `);
  });
});

// Helpers
const createResponse = (refName: string): ResponseObject => ({
  description: "a response",
  content: {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${refName}`,
      },
    },
  },
});
