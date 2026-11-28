/**
 * Navigation helpers
 */

/**
 * Where to go after signing in. Only in-app paths are allowed (never another
 * site, a protocol-relative URL, or the auth screens themselves).
 */
export function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/home';
  if (target === '/login' || target === '/register') return '/home';
  return target;
}
