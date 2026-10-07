import { describe, it, expect } from 'vitest';
import { slugOf, nextProject } from './next-project';

const order = ['dbs-affluent-segment-ai-assets', 'mannhummel', 'copy-of-international-green-building', 'notter'];
const built = new Set(['dbs-affluent-segment-ai-assets', 'mannhummel', 'notter', 'infographics']);
const exists = (s: string) => built.has(s);

describe('slugOf', () => {
  it('reads a homepage case-study link', () => expect(slugOf('/notter')).toBe('notter'));
  it('ignores the homepage, anchors, external links and nested paths', () => {
    for (const h of ['/', '/#contact', 'https://x.com/a', '/a/b', undefined]) expect(slugOf(h)).toBeNull();
  });
});

describe('nextProject', () => {
  it('returns the next project in homepage order', () => {
    expect(nextProject('dbs-affluent-segment-ai-assets', order, exists)).toBe('mannhummel');
  });
  it('skips a neighbour that was never built (password-protected page)', () => {
    expect(nextProject('mannhummel', order, exists)).toBe('notter');
  });
  it('wraps from the last project to the first', () => {
    expect(nextProject('notter', order, exists)).toBe('dbs-affluent-segment-ai-assets');
  });
  it('is null for a project missing from the homepage order (band links to /projects)', () => {
    expect(nextProject('infographics', order, exists)).toBeNull();
  });
  it('is null when there is nothing else to go to', () => {
    expect(nextProject('notter', ['notter', 'notter'], exists)).toBeNull();
  });
});
