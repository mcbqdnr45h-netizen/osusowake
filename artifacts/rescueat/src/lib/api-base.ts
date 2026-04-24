/**
 * Returns the correct API base URL for both web and Capacitor iOS builds.
 *
 * - In Capacitor: VITE_API_BASE is hardcoded to 'https://osusowakejapan.org'
 *   so fetch calls reach the real server (not capacitor://localhost).
 * - In web: falls back to BASE_URL (relative path, proxied by Vite).
 */
export const API_BASE: string =
  ((import.meta.env.VITE_API_BASE as string) || '').replace(/\/$/, '') ||
  (import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '');
