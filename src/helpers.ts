export const isNonNullable = <T extends any>(
  value: T
): value is NonNullable<T> => {
  return typeof value !== "undefined" && value !== null;
};
