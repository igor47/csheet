
export function zodToFormErrors<T>(zodError: T): Record<string, string> {
  const formErrors: Record<string, string> = {};
  if (zodError && typeof zodError === 'object' && 'errors' in zodError) {
    for (const err of (zodError as any).errors) {
      if (err.path && err.path.length > 0) {
        formErrors[err.path[0]] = err.message;
      }
    }
  }
  return formErrors;
}
