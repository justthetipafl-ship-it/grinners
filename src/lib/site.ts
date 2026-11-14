/** The site's public address. Set NEXT_PUBLIC_SITE_URL in Vercel once a custom domain is attached. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

/** The Grinners account on X. */
export const X_HANDLE = "GrinnersHQ";
export const X_URL = `https://x.com/${X_HANDLE}`;

/** Link that opens X with a pre-filled post about a page, crediting the Grinners account. */
export const shareToX = (text: string, path: string) =>
  `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(`${SITE_URL}${path}`)}&via=${X_HANDLE}`;
