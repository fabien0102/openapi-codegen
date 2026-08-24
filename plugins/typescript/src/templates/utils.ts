import {
  clientErrorStatus,
  serverErrorStatus,
} from "../core/getErrorResponseType";

export const getUtils = () =>
  `type ComputeRange<
 N extends number,
 Result extends Array<unknown> = []
> = Result["length"] extends N
 ? Result
 : ComputeRange<N, [...Result, Result["length"]]>;

export type ${clientErrorStatus} = Exclude<ComputeRange<500>[number], ComputeRange<400>[number]>;
export type ${serverErrorStatus} = Exclude<ComputeRange<600>[number], ComputeRange<500>[number]>;

function isMergeableObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value.constructor === Object || value.constructor === undefined)
  );
}

export function deepMerge<T, U extends T>(target: T, source: U): U {
  const result = { ...(target || {}) } as U;
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    result[key] =
      isMergeableObject(targetValue) && isMergeableObject(sourceValue)
        ? (deepMerge(targetValue, sourceValue) as U[Extract<keyof U, string>])
        : sourceValue;
  }
  return result;
}
`;
