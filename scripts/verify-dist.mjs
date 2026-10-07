import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const MB = 1024 * 1024;
export const LIMITS = { totalMax: 800 * MB, fileMax: 95 * MB };

const fileFor = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

/**
 * The paths dist/ must serve: the current sitemap list (rewritten by a live export) plus the
 * committed permanent list (every snapshot URL, including the six business-card slugs on printed
 * QR codes), so a live export that drops a page can never pass verification.
 */
export function requiredPaths(sitemap, permanent, extra = []) {
  return [...new Set([...sitemap, ...permanent, ...extra])].sort();
}

export function missingPages(paths, distFiles) {
  const have = new Set(distFiles);
  return paths.filter((p) => !have.has(fileFor(p)));
}

const ATTR_RE = /\s(href|src|poster|data-src|content|srcset)=(?:"([^"]*)"|'([^']*)')/g;

function* urlsIn(html) {
  for (const m of html.matchAll(ATTR_RE)) {
    const value = m[2] ?? m[3];
    if (m[1] === 'srcset') {
      for (const cand of value.split(',')) {
        const url = cand.trim().split(/\s+/)[0];
        if (url) yield url;
      }
    } else yield value;
  }
}

const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

/**
 * Internal links with no matching output file. Links to paths listed in `known`
 * (pages Wix links to but that were not cloned) are not broken; they are pushed
 * onto `knownOut` as { file, href, reason } so the CLI can report them.
 */
export function brokenLinks(pages, distFiles, base, known = [], knownOut = []) {
  const have = new Set(distFiles);
  const knownByPath = new Map(known.map((k) => [k.path, k.reason]));
  const b = base.replace(/\/$/, '');
  const out = [];
  const exists = (rel) => have.has(rel === '/' ? 'index.html' : rel.slice(1)) || have.has(fileFor(rel));
  for (const { file, html } of pages) {
    for (const href of urlsIn(html)) {
      if (!href.startsWith('/') || href.startsWith('//')) continue; // external, protocol-relative, mailto, tel, #anchor
      const path = href.split('#')[0].split('?')[0];
      if (b && path !== b && !path.startsWith(b + '/')) { out.push({ file, href }); continue; }
      const rel = (path.slice(b.length) || '/').replace(/(.)\/$/, '$1');
      const decoded = decode(rel);
      if (exists(rel) || exists(decoded)) continue;
      const reason = knownByPath.get(rel) ?? knownByPath.get(decoded);
      if (reason !== undefined) knownOut.push({ file, href, reason });
      else out.push({ file, href });
    }
  }
  return out;
}

/** files: [{ file, size }] in bytes. */
export function sizeProblems(files, { totalMax, fileMax } = LIMITS) {
  const total = files.reduce((n, f) => n + f.size, 0);
  return { total, tooBig: files.filter((f) => f.size > fileMax).map((f) => f.file), overTotal: total > totalMax };
}

async function listFiles(dir, root = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p, root)));
    else out.push(relative(root, p).split(sep).join('/'));
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.env.SITE_ENV === 'production' ? '' : '/achates360-website';
  const distFiles = await listFiles('dist');
  const sitemap = JSON.parse(await readFile('scripts/export-wix/sitemap-urls.json', 'utf8'));
  const permanent = JSON.parse(await readFile('scripts/export-wix/permanent-urls.json', 'utf8'));
  const extra = JSON.parse(await readFile('scripts/new-pages.json', 'utf8'));
  const paths = requiredPaths(sitemap, permanent, extra);
  const known = JSON.parse(await readFile('scripts/export-wix/known-missing.json', 'utf8'));
  const missing = missingPages(paths, distFiles);
  const pages = await Promise.all(distFiles.filter((f) => f.endsWith('.html')).map(async (f) => ({ file: f, html: await readFile(join('dist', f), 'utf8') })));
  const knownHits = [];
  const broken = brokenLinks(pages, distFiles, base, known, knownHits);
  const sizes = await Promise.all(distFiles.map(async (f) => ({ file: f, size: (await stat(join('dist', f))).size })));
  const { total, tooBig, overTotal } = sizeProblems(sizes);
  console.log(`pages: ${paths.length - missing.length}/${paths.length} required URLs built (sitemap ${sitemap.length}, permanent ${permanent.length}, new ${extra.length})`);
  console.log(`dist size: ${(total / MB).toFixed(1)} MB (limit ${LIMITS.totalMax / MB} MB)`);
  missing.forEach((p) => console.error(`MISSING  ${p}`));
  broken.forEach((l) => console.error(`BROKEN   ${l.file} -> ${l.href}`));
  // The site menus link the known-missing pages from every page: one line per target.
  for (const [href, hits] of Object.entries(Object.groupBy(knownHits, (l) => l.href))) {
    console.log(`KNOWN    ${href} (${hits[0].reason}) — linked from ${new Set(hits.map((l) => l.file)).size} page(s)`);
  }
  tooBig.forEach((f) => console.error(`TOO BIG  ${f} (>${LIMITS.fileMax / MB} MB)`));
  if (overTotal) console.error(`TOO BIG  dist/ total ${(total / MB).toFixed(1)} MB (>${LIMITS.totalMax / MB} MB)`);
  process.exit(missing.length || broken.length || tooBig.length || overTotal ? 1 : 0);
}
