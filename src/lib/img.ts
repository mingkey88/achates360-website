/**
 * An imported image's size and format, read without marking the original as used. Astro's image
 * proxy records any property read as a reference and then ships the untouched original in dist
 * (700 MB here); `clone` is the one read it exempts.
 */
export function meta(img: ImageMetadata): { width: number; height: number; format: string } {
  const c = (img as ImageMetadata & { clone?: ImageMetadata }).clone ?? img;
  return { width: c.width, height: c.height, format: c.format };
}
