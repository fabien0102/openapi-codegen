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

export function deepMerge<T>(
	target: T,
	source: T
): T {
	for (const key in source) {
		if (source[key] instanceof Object)
			Object.assign(source[key], deepMerge(target[key], source[key]));
	}
	Object.assign(target || {}, source);
	return target;
}
`;
