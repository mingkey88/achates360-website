import { mkdir, readFile, writeFile, access, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ORIGIN } from './lib/urls.mjs';
import { extractPage, extractRoutes } from './lib/extract.mjs';
import { mapPage, applyListing, toSite, toProjectsIndex } from './lib/map.mjs';
import { collectMedia, runJobs, mediaReport, dirSize } from './lib/media.mjs';
import { fetchSitemapPaths, sitemapRenderFailures } from './lib/sitemap.mjs';
import { writeRecord, exportLog } from './lib/write.mjs';
import { openBrowser, renderPage } from './render.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
const fresh = args.includes('--fresh');
// --offline (Ruling 29): rebuild src/content from the cached renders only — no sitemap fetch (reads
// sitemap-urls.json), no rendering, no media downloads. Proves the extract → map → write steps are
// deterministic without pulling live-site drift into the snapshot.
const offline = args.includes('--offline');
if (offline && fresh) throw new Error('--offline and --fresh cannot be combined');
// Accepts both `--only=a,b` and `--only a,b`.
const onlyIdx = args.findIndex((a) => a === '--only' || a.startsWith('--only='));
const onlyVal = onlyIdx < 0 ? null : args[onlyIdx].startsWith('--only=') ? args[onlyIdx].slice(7) : args[onlyIdx + 1];
const only = onlyVal ? onlyVal.split(',').filter(Boolean) : null;
const CACHE = '.cache/rendered';
const SHOTS = 'docs/reference';
const COLLECTIONS = ['home', 'projectsIndex', 'projects', 'cards', 'basic', 'site'];
const log = [];

const exists = (p) => access(p).then(() => true, () => false);
const slugOf = (path) => (path === '/' ? 'home' : path.slice(1));

// 1. Sitemap (throws on any failed request rather than export a partial site)
console.log(`export started ${new Date().toISOString()}`);
let paths;
if (offline) {
  paths = JSON.parse(await readFile('scripts/export-wix/sitemap-urls.json', 'utf8'));
  console.log(`sitemap: ${paths.length} pages (offline: scripts/export-wix/sitemap-urls.json)`);
} else {
  paths = await fetchSitemapPaths(ORIGIN);
  await writeFile('scripts/export-wix/sitemap-urls.json', JSON.stringify(paths, null, 2) + '\n');
  console.log(`sitemap: ${paths.length} pages`);
}

// 2. Render (cached). A cache entry is the HTML, its gallery sidecar and both screenshots;
// anything missing (e.g. an HTML rendered before sidecars existed) means render again.
const { browser, mobileContext } = offline ? {} : await openBrowser();
const renderFailed = [];
async function rendered(slug) {
  const html = `${CACHE}/${slug}.html`;
  const side = `${CACHE}/${slug}.gallery.json`;
  // Offline needs only what extraction reads; the screenshots are references, not inputs.
  const parts = offline ? [html, side] : [html, side, `${SHOTS}/${slug}/desktop.png`, `${SHOTS}/${slug}/mobile.png`];
  const cached = !fresh && (await Promise.all(parts.map(exists))).every(Boolean);
  if (!cached && offline) throw new Error(`offline: no cached render for ${slug} (${parts.join(', ')})`);
  if (!cached) {
    for (let attempt = 1; ; attempt++) {
      console.log(`render ${slug}${attempt > 1 ? ` (attempt ${attempt})` : ''}`);
      try {
        await renderPage(browser, slug, { htmlDir: CACHE, shotDir: SHOTS, mobileContext });
        break;
      } catch (e) {
        console.log(`render ${slug} failed: ${e.message}`);
        if (attempt >= 2) throw e;
      }
    }
  }
  return { html: await readFile(html, 'utf8'), sidecar: JSON.parse(await readFile(side, 'utf8')) };
}

// 3. Extract, then follow internal links not in the sitemap (one level)
const raws = new Map();
const skipped = new Set(); // linked pages not cloned (404, password, render failure)
const missing = new Map(); // slug -> reason, for linked pages Wix serves without content
const linkers = new Map(); // non-sitemap slug -> pages linking to it
const queue = paths.map(slugOf).filter((s) => !only || only.includes(s));
while (queue.length) {
  const slug = queue.shift();
  if (raws.has(slug) || skipped.has(slug)) continue;
  let page;
  try {
    page = await rendered(slug);
  } catch (e) {
    renderFailed.push(slug);
    skipped.add(slug);
    log.push({ level: 'warning', page: slug, message: `render failed, not exported: ${e.message.split('\n')[0]}` });
    continue;
  }
  const raw = extractPage(page.html, slug, page.sidecar);
  if (!raw.nodes.length) {
    // A linked page Wix serves without content (deleted → 404, or password-protected) is not
    // cloned: it would become an empty public page. A sitemap page is always kept.
    const reason = /^404\b/.test(raw.seo.title) ? '404'
      : page.html.includes('type="password"') ? 'password-protected'
      : 'no-content';
    if (!paths.includes(slug === 'home' ? '/' : `/${slug}`)) {
      missing.set(slug, reason);
      skipped.add(slug);
      continue;
    }
    log.push({ level: 'warning', page: slug, message: `Wix serves it with no content (${reason}) — exported with no content` });
  }
  raws.set(slug, raw);
  if (only) continue;
  const linked = [...raw.nodes, ...raw.footer].flatMap((n) => [
    n.href, ...(n.links ?? []).map((l) => l.href), ...(n.items ?? []).map((i) => i.href)]);
  for (const href of linked) {
    if (!href?.startsWith('/') || href.includes('#') || href.startsWith('/_files') || paths.includes(href)) continue;
    const s = slugOf(href);
    if (!linkers.has(s)) linkers.set(s, []);
    if (!linkers.get(s).includes(slug)) linkers.get(s).push(slug);
    if (!raws.has(s) && !skipped.has(s) && !queue.includes(s)) queue.push(s);
  }
}
const WHY = { '404': 'Wix serves a 404 page', 'password-protected': 'Wix serves it behind a password', 'no-content': 'Wix serves it with no content' };
const knownMissing = [];
for (const [slug, from] of linkers) {
  const by = `linked from ${from.join(', ')}`;
  if (raws.has(slug)) log.push({ level: 'info', page: slug, message: `${by} but missing from sitemap — exported` });
  else if (missing.has(slug)) {
    log.push({ level: 'query', page: slug, message: `${by}, but ${WHY[missing.get(slug)]} — not cloned` });
    knownMissing.push({ path: `/${slug}`, reason: missing.get(slug), linkedFrom: from });
  }
}
await browser?.close();

// Ruling 20: a sitemap page that failed to render would lose its content in the cleanup below,
// so abort before anything under src/content is touched.
const fatal = sitemapRenderFailures(renderFailed, paths);
if (fatal.length) {
  await mkdir('.cache', { recursive: true });
  await writeFile('.cache/export-log.aborted.md', exportLog(log));
  console.error(`ABORTED: ${fatal.length} sitemap page(s) failed to render: ${fatal.join(',')}. Nothing written to src/content; re-run to retry (cache keeps the rest). Log: .cache/export-log.aborted.md`);
  process.exit(1);
}

// 4. Hidden routes (in Wix router, not in sitemap, not linked)
if (raws.has('home')) {
  const routes = extractRoutes(await readFile(`${CACHE}/home.html`, 'utf8'));
  for (const p of routes.values()) {
    if (!raws.has(slugOf(p)) && !skipped.has(slugOf(p))) log.push({ level: 'query', page: slugOf(p), message: 'exists in Wix routing but is not in the sitemap or linked — not cloned' });
  }
}

// 5. Map
const records = [];
for (const raw of raws.values()) {
  const r = mapPage(raw);
  for (const w of r.warnings) log.push({ level: 'warning', page: raw.slug, message: w });
  records.push(r);
}
if (raws.has('home')) records.push({ collection: 'site', id: 'site', data: toSite(raws.get('home')) });
if (raws.has('projects')) {
  applyListing(records.filter((r) => r.collection === 'projects'), toProjectsIndex(raws.get('projects')));
  for (const r of records.filter((x) => x.collection === 'projects' && !x.data.listed)) {
    log.push({ level: 'query', page: r.id, message: 'live page not linked from /projects' });
  }
}

// 6. Content-level anomaly checks
// Wix duplicates still live and indexed (named here because their content differs from the
// original, so they cannot be detected).
const DUPLICATES = { 'copy-of-projects': '/projects' };
for (const r of records) {
  if (DUPLICATES[r.id]) log.push({ level: 'query', page: r.id, message: `duplicate of ${DUPLICATES[r.id]}, live and indexed` });
  for (const line of r.data.heroCaption?.split('\n') ?? []) {
    log.push({ level: 'query', page: r.id, message: `off-canvas "${line}" in the hero — shown on screens ≳2000px wide and read by screen readers; keep or remove?` });
  }
  if (r.collection === 'cards') {
    const d = r.data;
    const telDigits = d.phone.href.replace(/\D/g, '');
    if (!telDigits.endsWith(d.phone.display.replace(/\D/g, '').slice(-8))) {
      log.push({ level: 'query', page: r.id, message: `phone shows "${d.phone.display}" but dials "${d.phone.href}"` });
    }
    const emailTarget = d.email.href.replace(/^mailto:/, '').split('?')[0];
    if (emailTarget !== d.email.display) {
      log.push({ level: 'query', page: r.id, message: `email shows "${d.email.display}" but opens "${emailTarget}"` });
    }
  }
  const json = JSON.stringify(r.data);
  const emptyAlts = (json.match(/"alt":""/g) ?? []).length;
  if (emptyAlts) log.push({ level: 'info', page: r.id, message: `${emptyAlts} image(s) with no alt text on Wix (kept empty)` });
}

// 7. Write content. A full run first clears the collections' generated .md files, so a page
// whose collection changed (e.g. a fallback to basic) is never left in two collections.
if (!only) {
  for (const c of COLLECTIONS) {
    const dir = join(root, 'src/content', c);
    let files = [];
    try { files = await readdir(dir); } catch { /* not yet created */ }
    for (const f of files) if (f.endsWith('.md')) await rm(join(dir, f));
  }
}
for (const r of records) await writeRecord(root, r);
const perCollection = Object.entries(Object.groupBy(records, (r) => r.collection)).map(([c, xs]) => `${c} ${xs.length}`).join(', ');
console.log(`wrote ${records.length} content files (${perCollection})`);

// 8. Media
const cards = records.filter((r) => r.collection === 'cards').map((r) => {
  const vcf = raws.get(r.id).nodes.flatMap((n) => (n.kind === 'link' ? [n.href] : n.links?.map((l) => l.href) ?? [])).find((h) => h.includes('.vcf'));
  return { slug: r.id, vcfUrl: vcf.startsWith('/') ? ORIGIN + vcf : vcf };
});
if (offline) {
  console.log('media: skipped (offline)');
} else {
  const jobs = collectMedia([...raws.values()], cards);
  const res = await runJobs(jobs, { root, sourceMedia: 'source-media' });
  console.log(`media: ${res.downloaded} downloaded, ${res.skipped} unchanged, ${res.derived} derived, ${res.failed.length} failed`);
  for (const f of res.failed) log.push({ level: 'warning', page: 'media', message: `${f.url}: ${f.error}` });
}

// 9. Reports. A --only run sees part of the site, so its reports go to the cache and never
// replace the committed full-run reports.
const reportDir = only ? '.cache' : 'docs';
const suffix = only ? '.only' : '';
await mkdir(reportDir, { recursive: true });
await writeFile(`${reportDir}/media-report${suffix}.md`, await mediaReport(root));
await writeFile(`${reportDir}/export-log${suffix}.md`, exportLog(log));
console.log(`wrote ${reportDir}/media-report${suffix}.md and ${reportDir}/export-log${suffix}.md`);
if (!only) {
  knownMissing.sort((a, b) => a.path.localeCompare(b.path));
  await writeFile('scripts/export-wix/known-missing.json', JSON.stringify(knownMissing, null, 2) + '\n');
  console.log(`wrote scripts/export-wix/known-missing.json (${knownMissing.length} pages)`);
}
const counts = ['query', 'warning', 'info'].map((l) => `${log.filter((e) => e.level === l).length} ${l}`).join(', ');
console.log(`log: ${counts}`);
const orig = await dirSize(join(root, '.cache/originals'));
console.log(`untouched originals in .cache/originals (not committed): ${(orig.bytes / 1024 / 1024).toFixed(1)} MB in ${orig.files} files`);
if (renderFailed.length) {
  console.log(`render failed for ${renderFailed.length} linked page(s): ${renderFailed.join(',')} — re-run to retry (cache keeps the rest)`);
  process.exitCode = 1;
}
