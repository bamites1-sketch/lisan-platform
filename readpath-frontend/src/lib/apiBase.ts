// Dynamic API URL based on environment variable
export const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}
