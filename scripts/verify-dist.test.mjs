import { describe, it, expect } from 'vitest';
import { missingPages, brokenLinks, sizeProblems } from './verify-dist.mjs';

const dist = ['index.html', 'dxv.html', 'angeline.html', 'cards/angeline.vcf', 'media/video/v1.mp4', '_astro/x.webp', 'projects.html', 'media/my file.mp4'];

describe('missingPages', () => {
  it('maps sitemap paths to file-format output', () => {
    expect(missingPages(['/', '/dxv', '/angeline', '/projects'], dist)).toEqual([]);
  });
  it('reports what is missing', () => {
    expect(missingPages(['/', '/notter'], dist)).toEqual(['/notter']);
  });
});

describe('brokenLinks', () => {
  const B = '/achates360-website';
  it('accepts internal links, assets, anchors and external links', () => {
    const html = `<a href="${B}">h</a><a href="${B}/dxv">d</a><a href="${B}/cards/angeline.vcf">v</a>
      <video src="${B}/media/video/v1.mp4"></video><img src="${B}/_astro/x.webp"><a href="#contact">c</a>
      <a href="https://vimeo.com/1">e</a><a href="mailto:a@b.c">m</a><a href="tel:+651">t</a>`;
    expect(brokenLinks([{ file: 'index.html', html }], dist, B)).toEqual([]);
  });
  it('flags internal links with no output file and links missing the base', () => {
    const html = `<a href="${B}/gone">x</a><a href="/dxv">y</a>`;
    expect(brokenLinks([{ file: 'index.html', html }], dist, B)).toEqual([
      { file: 'index.html', href: `${B}/gone` }, { file: 'index.html', href: '/dxv' }]);
  });
  it('resolves fragments and queries on the bare base to index.html', () => {
    const html = `<a href="${B}#all-projects">a</a><a href="${B}/#x">b</a><a href="${B}?q=1">c</a><a href="${B}/dxv#top">d</a>`;
    expect(brokenLinks([{ file: 'projects.html', html }], dist, B)).toEqual([]);
  });
  it('with an empty base (production) resolves "/" and "/#frag"', () => {
    const html = `<a href="/">a</a><a href="/#x">b</a><a href="/dxv">c</a><a href="/nope">d</a>`;
    expect(brokenLinks([{ file: 'index.html', html }], dist, '')).toEqual([{ file: 'index.html', href: '/nope' }]);
  });
  it('does not count known-missing paths as broken, but still flags unknown ones', () => {
    const html = `<a href="${B}/secret#x">s</a><a href="${B}/gone">g</a>`;
    const known = [{ path: '/secret', reason: 'password-protected', linkedFrom: ['home'] }];
    const knownHits = [];
    expect(brokenLinks([{ file: 'index.html', html }], dist, B, known, knownHits))
      .toEqual([{ file: 'index.html', href: `${B}/gone` }]);
    expect(knownHits).toEqual([{ file: 'index.html', href: `${B}/secret#x`, reason: 'password-protected' }]);
  });
});

describe('brokenLinks: srcset, quoting, encoding', () => {
  const B = '/achates360-website';
  const run = (html) => brokenLinks([{ file: 'index.html', html }], dist, B);
  it('passes a valid multi-candidate srcset', () => {
    expect(run(`<img srcset="${B}/_astro/x.webp 400w, ${B}/_astro/x.webp 800w, ${B}/media/my%20file.mp4 2x">`)).toEqual([]);
  });
  it('flags a broken srcset candidate', () => {
    expect(run(`<img srcset="${B}/_astro/x.webp 400w, ${B}/_astro/gone.webp 800w">`))
      .toEqual([{ file: 'index.html', href: `${B}/_astro/gone.webp` }]);
  });
  it('checks data-src and root-relative content, skips absolute content', () => {
    expect(run(`<img data-src="${B}/nope.png"><meta content="${B}/nope2"><meta property="og:image" content="https://x.com/a.png">`))
      .toEqual([{ file: 'index.html', href: `${B}/nope.png` }, { file: 'index.html', href: `${B}/nope2` }]);
  });
  it('accepts single-quoted attributes', () => {
    expect(run(`<a href='${B}/dxv'>a</a><a href='${B}/gone'>b</a>`)).toEqual([{ file: 'index.html', href: `${B}/gone` }]);
  });
  it('skips protocol-relative URLs', () => {
    expect(run(`<script src="//cdn/x.js"></script>`)).toEqual([]);
  });
  it('decodes percent-encoding before lookup', () => {
    expect(run(`<video src="${B}/media/my%20file.mp4"></video>`)).toEqual([]);
    expect(run(`<video src="${B}/media/bad%E0%A4.mp4"></video>`)).toHaveLength(1);
  });
  it('resolves trailing slash and query on non-base paths', () => {
    expect(run(`<a href="${B}/dxv/">a</a><a href="${B}/dxv?x=1">b</a>`)).toEqual([]);
  });
});

describe('sizeProblems', () => {
  const MB = 1024 * 1024;
  it('passes when within limits', () => {
    expect(sizeProblems([{ file: 'a', size: 5 * MB }, { file: 'b', size: 4 * MB }], { totalMax: 10 * MB, fileMax: 6 * MB })).toEqual({ total: 9 * MB, tooBig: [], overTotal: false });
  });
  it('flags oversized files and an oversized total', () => {
    const r = sizeProblems([{ file: 'a', size: 7 * MB }, { file: 'b', size: 5 * MB }], { totalMax: 10 * MB, fileMax: 6 * MB });
    expect(r).toEqual({ total: 12 * MB, tooBig: ['a'], overTotal: true });
  });
});
