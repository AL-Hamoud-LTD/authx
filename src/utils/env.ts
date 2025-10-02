export function getEnv(name: string, fallback?: string): string {
  // Support both Node and Edge runtimes.
  // In most environments, process.env is available; in edge-like runtimes it may be undefined.
  // We defensively check globalThis and process presence.
  const hasProcessEnv = typeof process !== 'undefined' && typeof process.env !== 'undefined';
  const value = hasProcessEnv ? process.env[name] : undefined;

  if (value != null && value !== '') return value;
  if (fallback != null) return fallback;

  throw new Error(`Missing required environment variable: ${name}`);
}
