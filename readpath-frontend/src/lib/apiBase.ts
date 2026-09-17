// In production: set VITE_API_URL to your backend URL
// In development: empty string — Vite proxy forwards /api → localhost:5000

// PRODUCTION: Always use Back4app URL
const BACK4APP_URL = 'https://readpathbackend-fm8jnxat.b4a.run';

export const apiBase = import.meta.env.MODE === 'production' 
  ? BACK4APP_URL 
  : (import.meta.env.VITE_API_URL as string | undefined) || '';

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  return `${apiBase}${path}`
}
