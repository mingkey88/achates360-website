// Shared by the site (lib/seo.ts) and the build check (scripts/verify-dist.mjs), so the two cannot drift.
// Wix exports often carry the upload's file name as an image's description: with its extension
// ("SMRT_290926_ED-169.jpg"), without it ("Moving_Memories", "DBS_CIO_Video"), or with a mock-up's
// size and date stamp ("…_2000x2000px_06OCT22_…"). Real descriptions have spaces, so a single word with
// an underscore, or a run-together "QRcode", is a file name; a one-word name such as "Vimeo" is not.

/** True when an image description is an exported file name rather than words. */
export function isFileNameAlt(alt) {
  const a = (alt ?? '').trim();
  if (!a) return false;
  if (/\.(jpe?g|png|gif|webp|avif|svg|tiff?|heic)$/i.test(a)) return true;
  if (/\d+x\d+px|_\d{2}[A-Z]{3}\d{2}_/i.test(a)) return true;
  return !/\s/.test(a) && (/_/.test(a) || /qr-?code/i.test(a));
}
