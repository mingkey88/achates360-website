import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile, truncate } from 'node:fs/promises';
import sharp from 'sharp';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectMedia, runJobs, mediaReport } from './media.mjs';

// A small real PNG, so derived images can be decoded.
const png = (width, height = 10) => sharp({ create: { width, height, channels: 3, background: '#c33' } }).png().toBuffer();
const ORIG = '.cache/originals/wix';

const fakeRaw = {
  slug: 'x', seo: { ogImage: 'og~mv2.png' },
  nodes: [
    { kind: 'image', file: 'a~mv2.jpg' },
    { kind: 'bgvideo', videoId: 'vid1', quality: '720p', poster: 'vid1f000.jpg' },
    { kind: 'gallery', items: [{ file: 'a~mv2.jpg', video: null }, { file: 'vid2f003.jpg', video: { videoId: 'vid2', quality: '1080p' } }] },
  ],
  footer: [{ kind: 'image', file: 'ig.png' }], chrome: [], videos: new Map([['vid1', '720p'], ['vid2', '1080p']]),
};

describe('collectMedia', () => {
  it('dedupes images and creates video and vcf jobs', () => {
    const jobs = collectMedia([fakeRaw], [{ slug: 'angeline', vcfUrl: 'https://www.achates360.com/_files/ugd/x.vcf' }]);
    const images = jobs.filter((j) => j.kind === 'image').map((j) => j.dest);
    expect(images.sort()).toEqual(['src/assets/wix/a.jpg', 'src/assets/wix/ig.png', 'src/assets/wix/og.png', 'src/assets/wix/vid1f000.jpg', 'src/assets/wix/vid2f003.jpg']);
    expect(jobs.find((j) => j.videoId === 'vid2')).toMatchObject({ url: 'https://video.wixstatic.com/video/vid2/1080p/mp4/file.mp4', dest: 'public/media/video/vid2.mp4' });
    expect(jobs.find((j) => j.kind === 'vcf')).toMatchObject({ dest: 'public/cards/angeline.vcf' });
  });
  it('keeps the highest quality when a video id is seen with several qualities', () => {
    const r1 = { ...fakeRaw, nodes: [], footer: [], videos: new Map([['vidQ', '1080p']]) };
    const r2 = { ...fakeRaw, nodes: [], footer: [], videos: new Map([['vidQ', '480p']]) };
    for (const order of [[r1, r2], [r2, r1]]) {
      const v = collectMedia(order, []).filter((j) => j.videoId === 'vidQ');
      expect(v).toHaveLength(1);
      expect(v[0].url).toBe('https://video.wixstatic.com/video/vidQ/1080p/mp4/file.mp4');
    }
  });
  it('dedupes jobs by dest', () => {
    const r = { ...fakeRaw, seo: { ogImage: null }, nodes: [{ kind: 'image', file: 'a~mv2.jpg' }, { kind: 'image', file: 'a.jpg' }], footer: [], videos: new Map() };
    const jobs = collectMedia([r], [{ slug: 'abby', vcfUrl: 'u1' }, { slug: 'abby', vcfUrl: 'u1' }]);
    const dests = jobs.map((j) => j.dest);
    expect(dests).toEqual([...new Set(dests)]);
    expect(dests.filter((d) => d === 'src/assets/wix/a.jpg')).toHaveLength(1);
    expect(dests.filter((d) => d === 'public/cards/abby.vcf')).toHaveLength(1);
  });
});

describe('runJobs', () => {
  it('skips cached originals that already exist with the same size, downloads the rest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    const a = await png(20);
    const b = await png(30);
    await mkdir(join(root, ORIG), { recursive: true });
    await writeFile(join(root, ORIG, 'a.png'), a);
    const calls = [];
    const fetchImpl = async (url, opts = {}) => {
      calls.push([opts.method ?? 'GET', url]);
      return new Response(opts.method === 'HEAD' ? null : b, { status: 200, headers: { 'content-length': String(url.endsWith('a~mv2.png') ? a.length : b.length) } });
    };
    const jobs = [
      { kind: 'image', url: 'https://static.wixstatic.com/media/a~mv2.png', dest: 'src/assets/wix/a.png' },
      { kind: 'image', url: 'https://static.wixstatic.com/media/b~mv2.png', dest: 'src/assets/wix/b.png' },
    ];
    const res = await runJobs(jobs, { root, fetchImpl, log: () => {} });
    expect(res).toMatchObject({ skipped: 1, downloaded: 1, derived: 2, failed: [] });
    expect(await readFile(join(root, ORIG, 'b.png'))).toEqual(b);
    expect(await readFile(join(root, 'src/assets/wix/a.png'))).toEqual(a);
    expect(await readFile(join(root, 'src/assets/wix/b.png'))).toEqual(b);
    expect(calls.filter(([m]) => m === 'GET').map(([, u]) => u)).toEqual(['https://static.wixstatic.com/media/b~mv2.png']);
  });

  it('caps images wider than 2560 px, keeping aspect and format; copies smaller ones byte for byte; a second run skips', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    const wide = await png(3000, 1500);
    const small = await png(100, 50);
    const bodies = { 'wide.png': wide, 'small.png': small };
    const fetchImpl = async (url, opts = {}) => {
      const body = bodies[url.split('/').pop()];
      return new Response(opts.method === 'HEAD' ? null : body, { status: 200, headers: { 'content-length': String(body.length) } });
    };
    const jobs = Object.keys(bodies).map((f) => ({ kind: 'image', url: `https://x/${f}`, dest: `src/assets/wix/${f}` }));
    const opts = { root, fetchImpl, log: () => {} };
    expect(await runJobs(jobs, opts)).toMatchObject({ downloaded: 2, derived: 2, skipped: 0, failed: [] });
    const capped = await sharp(join(root, 'src/assets/wix/wide.png')).metadata();
    expect([capped.format, capped.width, capped.height]).toEqual(['png', 2560, 1280]);
    expect(await readFile(join(root, ORIG, 'wide.png'))).toEqual(wide);
    expect(await readFile(join(root, 'src/assets/wix/small.png'))).toEqual(small);
    expect(await runJobs(jobs, opts)).toMatchObject({ downloaded: 0, derived: 0, skipped: 2, failed: [] });
  });

  it('re-derives when the committed copy is missing even though the original is cached', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    const body = await png(40);
    await mkdir(join(root, ORIG), { recursive: true });
    await writeFile(join(root, ORIG, 'c.png'), body);
    const fetchImpl = async () => new Response(null, { status: 200, headers: { 'content-length': String(body.length) } });
    const res = await runJobs([{ kind: 'image', url: 'https://x/c.png', dest: 'src/assets/wix/c.png' }], { root, fetchImpl, log: () => {} });
    expect(res).toMatchObject({ downloaded: 0, skipped: 1, derived: 1 });
    expect(await readFile(join(root, 'src/assets/wix/c.png'))).toEqual(body);
  });

  it('uses a source-media original for a matching video id instead of downloading', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    await mkdir(join(root, 'source-media'), { recursive: true });
    await writeFile(join(root, 'source-media/DXV master vid9.mp4'), 'ORIGINAL');
    const fetchImpl = async () => { throw new Error('should not fetch'); };
    const res = await runJobs([{ kind: 'video', videoId: 'vid9', url: 'u', dest: 'public/media/video/vid9.mp4' }],
      { root, fetchImpl, sourceMedia: 'source-media', log: () => {} });
    expect(res.downloaded).toBe(1);
    expect(await readFile(join(root, 'public/media/video/vid9.mp4'), 'utf8')).toBe('ORIGINAL');
  });

  it('does not redo a source-media video whose output is newer than the source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    await mkdir(join(root, 'source-media'), { recursive: true });
    await writeFile(join(root, 'source-media/master vid9.mp4'), 'ORIGINAL');
    const fetchImpl = async () => { throw new Error('should not fetch'); };
    const job = { kind: 'video', videoId: 'vid9', url: 'u', dest: 'public/media/video/vid9.mp4' };
    const opts = { root, fetchImpl, sourceMedia: 'source-media', log: () => {} };
    expect(await runJobs([job], opts)).toMatchObject({ downloaded: 1, skipped: 0 });
    expect(await runJobs([job], opts)).toMatchObject({ downloaded: 0, skipped: 1, failed: [] });
  });

  it('falls through to GET when HEAD throws', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    const body = await png(20);
    await mkdir(join(root, ORIG), { recursive: true });
    await writeFile(join(root, ORIG, 'a.png'), 'abc');
    const fetchImpl = async (url, opts = {}) => {
      if (opts.method === 'HEAD') throw new Error('HEAD not allowed');
      return new Response(body, { status: 200 });
    };
    const res = await runJobs([{ kind: 'image', url: 'https://x/a~mv2.png', dest: 'src/assets/wix/a.png' }], { root, fetchImpl, log: () => {} });
    expect(res).toMatchObject({ downloaded: 1, skipped: 0, failed: [] });
    expect(await readFile(join(root, 'src/assets/wix/a.png'))).toEqual(body);
  });

  it('re-downloads an existing file when HEAD gives no content-length', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    const body = await png(20);
    await mkdir(join(root, ORIG), { recursive: true });
    await writeFile(join(root, ORIG, 'a.png'), 'abc');
    const fetchImpl = async (url, opts = {}) => new Response(opts.method === 'HEAD' ? null : body, { status: 200 });
    const res = await runJobs([{ kind: 'image', url: 'https://x/a~mv2.png', dest: 'src/assets/wix/a.png' }], { root, fetchImpl, log: () => {} });
    expect(res).toMatchObject({ downloaded: 1, skipped: 0 });
  });

  it('records failures without throwing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    const fetchImpl = async () => new Response('nope', { status: 403 });
    const res = await runJobs([{ kind: 'image', url: 'https://x/y.jpg', dest: 'src/assets/wix/y.jpg' }], { root, fetchImpl, log: () => {} });
    expect(res.failed).toHaveLength(1);
    expect(res.failed[0].error).toMatch(/403/);
  });
});

describe('mediaReport', () => {
  it('measures the committed media and notes the size of the cached originals', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    await mkdir(join(root, 'src/assets/wix'), { recursive: true });
    await mkdir(join(root, ORIG), { recursive: true });
    await writeFile(join(root, 'src/assets/wix/a.png'), Buffer.alloc(1024 * 1024));
    await writeFile(join(root, ORIG, 'a.png'), Buffer.alloc(3 * 1024 * 1024));
    const md = await mediaReport(root);
    expect(md).toContain('Total committed media: **1.0 MB** in 1 files.');
    expect(md).toContain('Untouched originals in .cache/originals (not committed): 3.0 MB in 1 files.');
    expect(md).not.toContain('THRESHOLD EXCEEDED');
    expect(md).toContain('informational');
  });

  // Sparse files: large sizes without writing the bytes.
  const sparse = async (path, mb) => { await writeFile(path, ''); await truncate(path, mb * 1024 * 1024); };

  it('treats the source total as informational: over 800 MB is not a stop (Ruling 18)', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    await mkdir(join(root, 'src/assets/wix'), { recursive: true });
    for (let i = 0; i < 9; i++) await sparse(join(root, `src/assets/wix/f${i}.png`), 94);
    const md = await mediaReport(root);
    expect(md).toContain('Total committed media: **846.0 MB**');
    expect(md).not.toContain('THRESHOLD EXCEEDED');
    expect(md).toMatch(/binding .*dist\//);
  });

  it('still stops on a source file over 95 MB', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    await mkdir(join(root, 'public/media/video'), { recursive: true });
    await sparse(join(root, 'public/media/video/big.mp4'), 96);
    expect(await mediaReport(root)).toContain('THRESHOLD EXCEEDED');
  });
});
