/**
 * The cross-page transition name for a project's picture (base.css @view-transition): the same on its
 * tile and on its case study's hero, so the browser grows one into the other. From the project's slug or
 * its link ("/dxv"); undefined for anything that is not a single project page. A name may appear only
 * once per page, so only one tile per project carries it (the work tiles, the /projects cards).
 */
export function morphName(slugOrHref: string | undefined): string | undefined {
  const slug = slugOrHref?.replace(/^\//, '');
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return undefined;
  return `p-${slug.toLowerCase()}`;
}
