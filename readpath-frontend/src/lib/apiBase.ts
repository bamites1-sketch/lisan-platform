// Always use Back4App URL in production - updated for CORS fix
export const apiBase = import.meta.env.MODE === 'production' 
  ? 'https://lisanplatform2-eadieyf3.b4a.run'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}
