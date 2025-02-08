type ComputeRange<
  N extends number,
  Result extends Array<unknown> = [],
> = Result["length"] extends N
  ? Result
  : ComputeRange<N, [...Result, Result["length"]]>;

export type ClientErrorStatus = Exclude<
  ComputeRange<500>[number],
  ComputeRange<400>[number]
>;
export type ServerErrorStatus = Exclude<
  ComputeRange<600>[number],
  ComputeRange<500>[number]
>;

export function deepMerge<Target, Source>(
  target: Target,
  source: Source
): Source {
  for (const key in source) {
    if (source[key] instanceof Object)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.assign(source[key], deepMerge((target as any)[key], source[key]));
  }
  Object.assign(target || {}, source);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return target as any;
}
