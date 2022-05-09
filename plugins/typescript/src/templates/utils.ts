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

export type ${clientErrorStatus} = Exclude<ComputeRange<500>[-1], ComputeRange<400>[-1]>;
export type ${serverErrorStatus} = Exclude<ComputeRange<600>[-1], ComputeRange<500>[-1]>;`;
