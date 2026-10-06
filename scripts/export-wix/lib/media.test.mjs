import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectMedia, runJobs } from './media.mjs';

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
  it('skips files that already exist with the same size, downloads the rest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    await mkdir(join(root, 'src/assets/wix'), { recursive: true });
    await writeFile(join(root, 'src/assets/wix/a.jpg'), 'abc');
    const calls = [];
    const fetchImpl = async (url, opts = {}) => {
      calls.push([opts.method ?? 'GET', url]);
      return new Response(opts.method === 'HEAD' ? null : 'hello', { status: 200, headers: { 'content-length': url.endsWith('a~mv2.jpg') ? '3' : '5' } });
    };
    const jobs = [
      { kind: 'image', url: 'https://static.wixstatic.com/media/a~mv2.jpg', dest: 'src/assets/wix/a.jpg' },
      { kind: 'image', url: 'https://static.wixstatic.com/media/b~mv2.jpg', dest: 'src/assets/wix/b.jpg' },
    ];
    const res = await runJobs(jobs, { root, fetchImpl, log: () => {} });
    expect(res.skipped).toBe(1);
    expect(res.downloaded).toBe(1);
    expect(await readFile(join(root, 'src/assets/wix/b.jpg'), 'utf8')).toBe('hello');
    expect(calls.filter(([m]) => m === 'GET').map(([, u]) => u)).toEqual(['https://static.wixstatic.com/media/b~mv2.jpg']);
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
    await mkdir(join(root, 'src/assets/wix'), { recursive: true });
    await writeFile(join(root, 'src/assets/wix/a.jpg'), 'abc');
    const fetchImpl = async (url, opts = {}) => {
      if (opts.method === 'HEAD') throw new Error('HEAD not allowed');
      return new Response('hello', { status: 200 });
    };
    const res = await runJobs([{ kind: 'image', url: 'https://x/a~mv2.jpg', dest: 'src/assets/wix/a.jpg' }], { root, fetchImpl, log: () => {} });
    expect(res).toMatchObject({ downloaded: 1, skipped: 0, failed: [] });
    expect(await readFile(join(root, 'src/assets/wix/a.jpg'), 'utf8')).toBe('hello');
  });

  it('re-downloads an existing file when HEAD gives no content-length', async () => {
    const root = await mkdtemp(join(tmpdir(), 'a360-'));
    await mkdir(join(root, 'src/assets/wix'), { recursive: true });
    await writeFile(join(root, 'src/assets/wix/a.jpg'), 'abc');
    const fetchImpl = async (url, opts = {}) => new Response(opts.method === 'HEAD' ? null : 'hello', { status: 200 });
    const res = await runJobs([{ kind: 'image', url: 'https://x/a~mv2.jpg', dest: 'src/assets/wix/a.jpg' }], { root, fetchImpl, log: () => {} });
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
