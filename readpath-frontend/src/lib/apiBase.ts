// Always use Back4App URL in production - updated for new deployment
export const apiBase = import.meta.env.MODE === 'production' 
  ? 'https://lisanplatform2-0my7f45h.b4a.run'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}
