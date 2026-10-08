export function errorText(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error &&
    error !== null &&
    'errors' in error
  ) {
    const errors = (error as { errors?: ReadonlyArray<{ message?: string }> })
      .errors
    const message = errors?.find((item) => item.message)?.message
    if (message) return message
  }
  if (error instanceof Error) {
    const graphQL = error.message.match(/GraphQL error: (.+)/)?.[1]
    if (graphQL) return graphQL
    if (error.message && !error.message.startsWith('Response not successful')) {
      return error.message
    }
  }
  return fallback
}
