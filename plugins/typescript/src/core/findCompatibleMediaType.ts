import {
  MediaTypeObject,
  RequestBodyObject,
  ResponseObject,
} from "openapi3-ts/oas30";

/**
 * Returns the first compatible media type.
 *
 * @param requestBodyOrResponseObject
 * @returns
 */
export const findCompatibleMediaType = (
  requestBodyOrResponseObject: RequestBodyObject | ResponseObject
): MediaTypeObject | undefined => {
  if (!requestBodyOrResponseObject.content) return;
  for (const contentType of Object.keys(requestBodyOrResponseObject.content)) {
    if (
      contentType.startsWith("*/*") ||
      contentType.startsWith("application/json") ||
      contentType.startsWith("application/octet-stream") ||
      contentType.startsWith("multipart/form-data")
    ) {
      return requestBodyOrResponseObject.content[contentType];
    }
  }
};
