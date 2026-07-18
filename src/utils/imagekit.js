const imageKitEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';

/**
 * Builds a transformed ImageKit URL or returns the path directly if it's already a full URL or local asset.
 * @param {string} path - The media path (e.g. "cookie_vanilla.png")
 * @param {string} [transformations=""] - Comma-separated ImageKit transformations (e.g. "tr=w-400,h-400,fo-auto")
 */
export function getImageKitUrl(path, transformations = '') {
  if (!path) return '';
  
  // If it's already an absolute URL or starting with assets/, return as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('assets/') || path.startsWith('/assets/')) {
    return path;
  }

  if (!imageKitEndpoint) {
    // No ImageKit endpoint, return local fallback path from assets folder
    return `assets/${path}`;
  }

  // Build ImageKit URL: ensure endpoint has trailing slash and path doesn't have leading slash
  const endpoint = imageKitEndpoint.endsWith('/') ? imageKitEndpoint : `${imageKitEndpoint}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  let url = `${endpoint}${cleanPath}`;
  if (transformations) {
    url += `?${transformations}`;
  }
  return url;
}
