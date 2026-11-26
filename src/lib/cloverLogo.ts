export interface CloverFaviconPalette {
  leafALight: string
  leafADark: string
  leafBLight: string
  leafBDark: string
  stroke: string
  vein: string
}

export const CLOVER_PATHS = {
  top: 'M32 32 C25 26 19 18 23 12 C26 8 30 10 32 14 C34 10 38 8 41 12 C45 18 39 26 32 32 Z',
  bottom:
    'M32 32 C25 38 19 46 23 52 C26 56 30 54 32 50 C34 54 38 56 41 52 C45 46 39 38 32 32 Z',
  left: 'M32 32 C26 25 18 19 12 23 C8 26 10 30 14 32 C10 34 8 38 12 41 C18 45 26 39 32 32 Z',
  right:
    'M32 32 C38 25 46 19 52 23 C56 26 54 30 50 32 C54 34 56 38 52 41 C46 45 38 39 32 32 Z',
  veins: 'M32 17 L32 28 M32 36 L32 47 M17 32 L28 32 M36 32 L47 32',
  crest:
    'M32 25.5 L34.2 29.8 L38.5 32 L34.2 34.2 L32 38.5 L29.8 34.2 L25.5 32 L29.8 29.8 Z',
} as const

/**
 * Builds a standalone SVG data URI of the stemless two-tone four-leaf clover
 * colored with the active theme's contrasting leaf palettes for the browser tab.
 */
export function buildCloverFaviconDataUrl(p: CloverFaviconPalette): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
<defs>
<radialGradient id="la" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="${p.leafALight}"/><stop offset="100%" stop-color="${p.leafADark}"/></radialGradient>
<radialGradient id="lb" cx="40%" cy="35%" r="75%"><stop offset="0%" stop-color="${p.leafBLight}"/><stop offset="100%" stop-color="${p.leafBDark}"/></radialGradient>
<linearGradient id="cr" x1="32" y1="25.5" x2="32" y2="38.5" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${p.leafALight}"/><stop offset="100%" stop-color="${p.leafADark}"/></linearGradient>
</defs>
<path d="${CLOVER_PATHS.top}" fill="url(#la)" stroke="${p.stroke}" stroke-width="2" stroke-linejoin="round"/>
<path d="${CLOVER_PATHS.bottom}" fill="url(#la)" stroke="${p.stroke}" stroke-width="2" stroke-linejoin="round"/>
<path d="${CLOVER_PATHS.left}" fill="url(#lb)" stroke="${p.stroke}" stroke-width="2" stroke-linejoin="round"/>
<path d="${CLOVER_PATHS.right}" fill="url(#lb)" stroke="${p.stroke}" stroke-width="2" stroke-linejoin="round"/>
<path d="${CLOVER_PATHS.veins}" stroke="${p.vein}" stroke-opacity="0.45" stroke-width="1.3" stroke-linecap="round"/>
<path d="${CLOVER_PATHS.crest}" fill="url(#cr)" stroke="${p.stroke}" stroke-width="1.4" stroke-linejoin="round"/>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
