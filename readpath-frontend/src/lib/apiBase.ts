// Use environment variable in production, localhost in development
export const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}
