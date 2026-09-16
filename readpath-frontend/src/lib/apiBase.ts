// In production: set VITE_API_URL to your Render backend URL
// e.g. https://lisan-api.onrender.com
// In development: empty string — Vite proxy forwards /api → localhost:5000
export const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}
