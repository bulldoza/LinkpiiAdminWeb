// Listing photos are served by Cloudinary at full upload size (often
// 1-3 MB). For card thumbnails, ask Cloudinary for a resized, auto-format
// (WebP/AVIF where supported), auto-quality version instead - a big saving
// on mobile data. The resize is appended AFTER any transformation already
// in the URL (e.g. the Linkpii watermark) so the watermark is unchanged.
// Non-Cloudinary URLs, or URLs we can't parse, are returned untouched.

export function cardImage(url, width = 480) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) return url;
  const match = url.match(/^(.*\/image\/upload\/)(.*?)(v\d+\/.*)$/);
  if (!match) return url;
  const [, base, existing, rest] = match;
  return `${base}${existing}c_limit,w_${width},f_auto,q_auto/${rest}`;
}
