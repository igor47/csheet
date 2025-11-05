import type { ToolExecutorResult } from "@src/tools"

/**
 * Standard result type for all service functions
 * Services return either a successful result with typed data,
 * or validation errors with form values for re-population
 *
 * @template TResult - The type of data returned on success
 */
export type ServiceResult<TResult = undefined> =
  | { complete: true; result: TResult }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Convert a service result to a ToolExecutorResult
 * Automatically handles error concatenation and success data extraction
 *
 * @param result - The service result to convert
 * @returns ToolExecutorResult for storing in database and returning to LLM
 */
export function serviceResultToToolResult<TResult>(
  result: ServiceResult<TResult>
): ToolExecutorResult {
  if (!result.complete) {
    const errorMessage = Object.values(result.errors).join(", ")
    return {
      status: "failed",
      error: errorMessage,
    }
  }

  // For success, extract the result data
  // If result is undefined, return success without data
  if (result.result === undefined) {
    return { status: "success" }
  }

  return {
    status: "success",
    data: result.result as Record<string, unknown>,
  }
}
