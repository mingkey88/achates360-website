import { readFile, readdir, stat } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
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

export const JS_BUDGET = 80 * 1024;

/** Structural rules every built page must meet (spec §1 success criteria, plan Review Focus). */
export function pageChecks(pages, { production, base }) {
  const out = [];
  const b = base.replace(/\/$/, '');
  for (const { file, html } of pages) {
    const add = (problem) => out.push({ file, problem });
    const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1s !== 1) add(`${h1s} h1 elements (expected exactly 1)`);
    if (!html.includes('class="site-header')) add('missing .site-header');
    if (!html.includes('class="site-footer')) add('missing .site-footer');
    if (!html.includes(`href="${b}/services"`)) add('no link to /services');
    if (html.includes('data-page="project"') && !html.includes('class="next-project"')) add('case study without .next-project band');
    if (production && html.includes('data-placeholder')) add('placeholder copy in a production build');
    if (/data-(split|reveal)/.test(html) && !html.includes('motion-ready')) add('reveal hooks without the 3s motion fallback script');
  }
  return out;
}

/** Module script URLs a page loads. */
export function scriptFiles(html) {
  return [...html.matchAll(/<script\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /\btype="module"/.test(tag))
    .map((tag) => tag.match(/\bsrc="([^"]+)"/)?.[1])
    .filter(Boolean);
}

/** Static imports in a bundled module (dynamic import() is loaded on demand and not counted). */
export function importsOf(js) {
  return [...js.matchAll(/(?:\bfrom\s*|\bimport\s*)["']([^"']+\.js)["']/g)].map((m) => m[1]);
}

/** Gzipped JS bytes per page: inline module scripts + every script file and its static imports. */
export async function jsWeights(pages, readJs) {
  const cache = new Map();
  const size = async (p) => {
    if (!cache.has(p)) {
      const js = await readJs(p);
      cache.set(p, js === null ? { bytes: 0, deps: [], missing: true } : { bytes: gzipSync(js).length, deps: importsOf(js).map((d) => posix.join(posix.dirname(p), d)) });
    }
    return cache.get(p);
  };
  const out = [];
  for (const { file, html } of pages) {
    const seen = new Set();
    const unresolved = [];
    const queue = scriptFiles(html);
    let bytes = [...html.matchAll(/<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/g)]
      .filter((m) => !/\bsrc=/.test(m[0]) && m[1].trim())
      .reduce((n, m) => n + gzipSync(m[1]).length, 0);
    while (queue.length) {
      const p = queue.shift();
      if (seen.has(p)) continue;
      seen.add(p);
      const s = await size(p);
      if (s.missing) unresolved.push(p);
      bytes += s.bytes;
      queue.push(...s.deps);
    }
    out.push({ file, bytes, unresolved });
  }
  return out;
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
  const production = process.env.SITE_ENV === 'production';
  const checks = pageChecks(pages, { production, base });
  const readJs = async (url) => {
    const rel = url.startsWith(base + '/') ? url.slice(base.length + 1) : url.replace(/^\//, '');
    try { return await readFile(join('dist', rel), 'utf8'); } catch { return null; }
  };
  const weights = await jsWeights(pages, readJs);
  const heavy = weights.filter((w) => w.bytes > JS_BUDGET);
  const unresolved = weights.flatMap((w) => w.unresolved.map((path) => ({ file: w.file, path })));
  const top = weights.reduce((a, w) => (w.bytes > a.bytes ? w : a), { file: '-', bytes: 0 });
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
  checks.forEach((c) => console.error(`PAGE     ${c.file}: ${c.problem}`));
  heavy.forEach((w) => console.error(`JS       ${w.file}: ${(w.bytes / 1024).toFixed(1)} KB gzip > ${JS_BUDGET / 1024} KB`));
  unresolved.forEach((u) => console.error(`JS       ${u.file}: unresolved script ${u.path}`));
  console.log(`js: heaviest page ${top.file} ${(top.bytes / 1024).toFixed(1)} KB gzip (budget ${JS_BUDGET / 1024} KB)`);
  tooBig.forEach((f) => console.error(`TOO BIG  ${f} (>${LIMITS.fileMax / MB} MB)`));
  if (overTotal) console.error(`TOO BIG  dist/ total ${(total / MB).toFixed(1)} MB (>${LIMITS.totalMax / MB} MB)`);
  process.exit(missing.length || broken.length || checks.length || heavy.length || unresolved.length || tooBig.length || overTotal ? 1 : 0);
}
