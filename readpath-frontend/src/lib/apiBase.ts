// In production: set VITE_API_URL to your backend URL
// In development: empty string — Vite proxy forwards /api → localhost:5000

// Fallback to hardcoded production URL if VITE_API_URL is not set
const DEFAULT_PROD_URL = 'https://readpathbackend-fm8jnxat.b4a.run';
export const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || 
  (import.meta.env.MODE === 'production' ? DEFAULT_PROD_URL : '');

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}
