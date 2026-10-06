import { mkdir, stat, writeFile, copyFile, readdir, readFile, rename } from 'node:fs/promises';
import { join, dirname, extname, basename } from 'node:path';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { originalImageUrl, localName, videoFileUrl, bestQuality } from './urls.mjs';

export function collectMedia(raws, cards) {
  const images = new Set();
  const videos = new Map();
  // A video seen at several qualities (on different pages) is fetched once, at the highest.
  const addVideo = (id, q) => videos.set(id, videos.has(id) ? bestQuality([{ quality: videos.get(id) }, { quality: q }]) : q);
  const visit = (nodes) => {
    for (const n of nodes) {
      if (n.kind === 'image') images.add(n.file);
      if (n.kind === 'bgvideo') images.add(n.poster);
      if (n.kind === 'gallery') for (const i of n.items) if (i.file) images.add(i.file);
    }
  };
  for (const r of raws) {
    visit(r.nodes); visit(r.footer); visit(r.chrome);
    if (r.seo.ogImage) images.add(r.seo.ogImage);
    for (const [id, q] of r.videos) addVideo(id, q);
  }
  const jobs = [
    ...[...images].map((f) => ({ kind: 'image', url: originalImageUrl(f), dest: `src/assets/wix/${localName(f)}` })),
    ...[...videos].map(([id, q]) => ({ kind: 'video', videoId: id, url: videoFileUrl(id, q), dest: `public/media/video/${id}.mp4` })),
    ...cards.map((c) => ({ kind: 'vcf', url: c.vcfUrl, dest: `public/cards/${c.slug}.vcf` })),
  ];
  // One job per destination (e.g. `a~mv2.jpg` and `a.jpg` both land at src/assets/wix/a.jpg); first wins.
  const byDest = new Map();
  for (const j of jobs) if (!byDest.has(j.dest)) byDest.set(j.dest, j);
  return [...byDest.values()];
}

async function size(path) {
  try { return (await stat(path)).size; } catch { return -1; }
}

async function mtime(path) {
  try { return (await stat(path)).mtimeMs; } catch { return -1; }
}

async function findSource(root, sourceMedia, videoId) {
  if (!sourceMedia) return null;
  const dir = join(root, sourceMedia);
  let files;
  try { files = await readdir(dir); } catch { return null; }
  let map = {};
  try { map = JSON.parse(await readFile(join(dir, 'map.json'), 'utf8')); } catch { /* optional */ }
  const name = map[videoId] ?? files.find((f) => f.includes(videoId));
  return name ? join(dir, name) : null;
}

// Ruling 15: committed images are capped at 2560 px wide; untouched originals stay in the
// git-ignored cache. Wider images are resized in their own format at high quality; narrower
// images, GIFs and formats sharp cannot re-encode here are copied byte for byte.
export const MAX_WIDTH = 2560;
export const ORIGINALS = '.cache/originals/wix';
const ENCODE = {
  jpeg: (img) => img.jpeg({ quality: 90, mozjpeg: true }),
  png: (img) => img.png({ compressionLevel: 9, palette: false }),
  webp: (img) => img.webp({ quality: 90 }),
};

async function writeAtomic(dest, data) {
  const tmp = `${dest}.tmp-${process.pid}`;
  await writeFile(tmp, data);
  await rename(tmp, dest);
}

async function deriveImage(original, dest) {
  const { format, width } = await sharp(original).metadata();
  if (width > MAX_WIDTH && ENCODE[format]) {
    const img = sharp(original).keepMetadata().resize({ width: MAX_WIDTH, withoutEnlargement: true });
    await writeAtomic(dest, await ENCODE[format](img).toBuffer());
    return 'resized';
  }
  await writeAtomic(dest, await readFile(original));
  return 'copied';
}

const hasFfmpeg = () => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } };

export async function runJobs(jobs, { root = process.cwd(), fetchImpl = fetch, sourceMedia, log = console.log, concurrency = 4 } = {}) {
  const result = { downloaded: 0, skipped: 0, derived: 0, failed: [] };
  const queue = [...jobs];

  async function one(job) {
    const dest = join(root, job.dest);
    await mkdir(dirname(dest), { recursive: true });

    if (job.kind === 'video') {
      const src = await findSource(root, sourceMedia, job.videoId);
      if (src) {
        const [srcTime, destTime] = await Promise.all([mtime(src), mtime(dest)]);
        if (destTime >= srcTime) { result.skipped++; return; } // output already made from this original
        if (extname(src).toLowerCase() === '.mp4') await copyFile(src, dest);
        else if (hasFfmpeg()) {
          execFileSync('ffmpeg', ['-y', '-i', src, '-c:v', 'libx264', '-crf', '20', '-preset', 'slow',
            '-vf', "scale='min(1920,iw)':-2", '-c:a', 'aac', '-movflags', '+faststart', dest], { stdio: 'ignore' });
        } else throw new Error(`${src} is not .mp4 and ffmpeg is not installed`);
        log(`original  ${job.dest}  <- ${src}`);
        result.downloaded++;
        return;
      }
    }

    // Images download to the originals cache and are then derived into dest; other kinds
    // download straight to dest.
    const target = job.kind === 'image' ? join(root, ORIGINALS, basename(job.dest)) : dest;
    await mkdir(dirname(target), { recursive: true });
    let fetched = true;
    const existing = await size(target);
    if (existing > 0) {
      // Skip only on a positive size match; a HEAD that fails or gives no length means re-download.
      let head = null;
      try { head = await fetchImpl(job.url, { method: 'HEAD' }); } catch { /* fall through to GET */ }
      const len = Number(head?.headers.get('content-length'));
      if (head?.ok && len > 0 && len === existing) fetched = false;
    }
    if (fetched) {
      const res = await fetchImpl(job.url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${job.url}`);
      await writeAtomic(target, Buffer.from(await res.arrayBuffer()));
      log(`download  ${job.kind === 'image' ? join(ORIGINALS, basename(job.dest)) : job.dest}`);
      result.downloaded++;
    } else {
      result.skipped++;
    }
    if (job.kind === 'image') {
      const [origTime, destTime] = await Promise.all([mtime(target), mtime(dest)]);
      if (destTime >= origTime) return; // committed copy already made from this original
      const how = await deriveImage(target, dest);
      log(`${how.padEnd(8)}  ${job.dest}`);
      result.derived++;
    }
  }

  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      try { await one(job); } catch (e) { result.failed.push({ url: job.url, error: String(e.message ?? e) }); }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return result;
}

async function listFiles(dir) {
  let out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await listFiles(p));
    else out.push({ path: p, size: (await stat(p)).size });
  }
  return out;
}

export async function mediaReport(root) {
  const files = [
    ...(await listFiles(join(root, 'src/assets/wix'))),
    ...(await listFiles(join(root, 'public/media'))),
    ...(await listFiles(join(root, 'public/cards'))),
  ];
  const mb = (b) => (b / 1024 / 1024).toFixed(1) + ' MB';
  const byExt = {};
  for (const f of files) {
    const ext = extname(f.path).toLowerCase() || '(none)';
    byExt[ext] ??= { count: 0, bytes: 0 };
    byExt[ext].count++; byExt[ext].bytes += f.size;
  }
  const total = files.reduce((s, f) => s + f.size, 0);
  const originals = await listFiles(join(root, '.cache/originals'));
  const origTotal = originals.reduce((s, f) => s + f.size, 0);
  const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 20);
  // Ruling 18: spec §5.5's 800 MB / 95 MB limits bind the BUILT output (Astro re-encodes images),
  // checked on dist/ in Task 15. Here the total is informational; a source file over 95 MB is still
  // a stop, since git rejects files over 100 MB.
  const over = files.some((f) => f.size > 95 * 1024 * 1024);
  return [
    '# Media report', '',
    `Total committed media: **${mb(total)}** in ${files.length} files.`, '',
    `Untouched originals in .cache/originals (not committed): ${mb(origTotal)} in ${originals.length} files.`, '',
    over ? '> **THRESHOLD EXCEEDED** — a source file is over 95 MB (git rejects files over 100 MB); stop and ask the user about media hosting (spec §5.5).'
      : '> No source file is over 95 MB. The source total is informational: the binding 800 MB / 95 MB check runs on the built dist/ in Task 15 (spec §5.5).', '',
    '| Type | Files | Size |', '|---|---|---|',
    ...Object.entries(byExt).sort((a, b) => b[1].bytes - a[1].bytes).map(([e, v]) => `| ${e} | ${v.count} | ${mb(v.bytes)} |`), '',
    '## 20 largest', '', '| File | Size |', '|---|---|',
    ...largest.map((f) => `| ${f.path.replace(root + '/', '')} | ${mb(f.size)} |`), '',
  ].join('\n');
}
