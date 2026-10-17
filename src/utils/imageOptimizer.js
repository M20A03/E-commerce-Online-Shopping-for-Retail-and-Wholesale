/**
 * Image Optimization & Resilient Fallback Utility
 * Provides automatic Cloudinary CDN parameter injection (f_auto, q_auto, responsive width)
 * and fail-safe SVG placeholders for Roshan Enterprises e-commerce storefront.
 */

export const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="100%" stop-color="#1E293B"/>
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F97316"/>
          <stop offset="100%" stop-color="#FB923C"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="16" fill="url(#bgGrad)"/>
      <circle cx="200" cy="180" r="70" fill="#334155" opacity="0.4"/>
      <!-- Shopping Bag / Grocery Icon -->
      <path d="M160 160 C160 138, 178 120, 200 120 C222 120, 240 138, 240 160" stroke="url(#accentGrad)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="145" y="160" width="110" height="90" rx="12" fill="none" stroke="url(#accentGrad)" stroke-width="6"/>
      <path d="M180 190 L220 190" stroke="#94A3B8" stroke-width="4" stroke-linecap="round"/>
      <path d="M180 215 L210 215" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>
      <text x="200" y="290" fill="#F8FAFC" font-size="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" text-anchor="middle" font-weight="700" letter-spacing="0.5">ROSHAN ENTERPRISES</text>
      <text x="200" y="315" fill="#94A3B8" font-size="12" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" text-anchor="middle" font-weight="500">Everyday Quality Essentials</text>
    </svg>
  `);

/**
 * Optimizes an image URL for high performance.
 * For Cloudinary URLs, injects automatic format (AVIF/WebP), optimal quality compression, and dimensional bounds.
 *
 * @param {string} url - Original image URL
 * @param {number} [width=500] - Target rendering width
 * @returns {string} - High-efficiency optimized image URL
 */
export function optimizeImageUrl(url, width = 500) {
  if (!url || typeof url !== 'string') {
    return FALLBACK_PRODUCT_IMAGE;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  // Optimize Cloudinary URLs
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    // If transformation flags are already present, leave intact or upgrade
    if (trimmed.includes('/image/upload/f_auto') || trimmed.includes('/image/upload/q_auto')) {
      return trimmed;
    }
    // Inject responsive auto-format, quality, and width bounds
    const transformFlags = `f_auto,q_auto,w_${width},c_limit`;
    return trimmed.replace('/image/upload/', `/image/upload/${transformFlags}/`);
  }

  return trimmed;
}

/**
 * Robust image error handler to prevent broken image icons and infinite error loops.
 *
 * @param {React.SyntheticEvent<HTMLImageElement, Event>} event - Image error event
 * @param {string} [secondaryFallback] - Optional secondary fallback image URL
 */
export function handleImageError(event, secondaryFallback) {
  const target = event.currentTarget;
  target.onerror = null; // Prevent recursion

  if (secondaryFallback && target.src !== secondaryFallback) {
    target.src = secondaryFallback;
  } else {
    target.src = FALLBACK_PRODUCT_IMAGE;
  }
}
