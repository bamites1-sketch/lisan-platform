// Use environment variable in production, fallback to Vercel backend if online, or localhost in development
const envApiUrl = import.meta.env.VITE_API_URL;
const isValidEnvUrl = envApiUrl && !envApiUrl.includes('b4a.run');

export const apiBase =
  (isValidEnvUrl ? envApiUrl : null) ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://readpath-backend.vercel.app'
    : 'http://localhost:5000');

/** Prefix a path with the backend base URL */
export function apiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${cleanPath}`;
}
