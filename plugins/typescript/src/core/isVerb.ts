export const isVerb = (
  verb: string
): verb is "get" | "post" | "patch" | "put" | "delete" =>
  ["get", "post", "patch", "put", "delete"].includes(verb);
