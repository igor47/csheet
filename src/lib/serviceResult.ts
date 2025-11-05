/**
 * Standard result type for all service functions
 * Services return either a successful result with typed data,
 * or validation errors with form values for re-population
 *
 * @template TResult - The type of data returned on success
 */
// biome-ignore lint/suspicious/noExplicitAny: Service results can be any valid JSON
export type ServiceResult<TResult = Record<string, any>> =
  | { complete: true; result: TResult }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }
