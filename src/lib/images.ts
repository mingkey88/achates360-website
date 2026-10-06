/**
 * True for GIFs, which are served as the original file (Astro's resizing would drop the animation).
 *
 * It reads the image's `fsPath`, not `format`: on a content-collection image, reading any other
 * property marks the original as referenced, and Astro then ships the full-size original next to
 * the resized copies (hundreds of MB across the site).
 */
export function isGif(img: ImageMetadata): boolean {
  const path = (img as ImageMetadata & { fsPath?: string }).fsPath;
  return path ? /\.gif$/i.test(path) : img.format === 'gif';
}
