/**
 * Resolves static public asset URLs (e.g. /templates/..., /logo.png) to include
 * the dynamic Vite BASE_URL (such as /simojang-dev/ or /simojang/).
 */
export function resolveAssetUrl(url) {
  if (!url || typeof url !== 'string' || url === '#') return '#'
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  const clean = url.replace(/^\/+/, '')
  return base ? `${base}/${clean}` : `/${clean}`
}
