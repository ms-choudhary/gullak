import { isAxiosError } from 'axios'

export function describeError(error: unknown): string {
  if (isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
