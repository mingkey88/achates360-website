import { describe, expect, it } from 'vitest';
import { categoryCount, serviceCount } from './service-counts';

const sections = [
  { heading: 'Strategic Branding', items: [{ href: '/a' }, { href: '/b' }, { href: '/hidden' }] },
  { heading: 'Graphic Design', items: [{ href: '/b' }, { href: '/c' }, {}] },
  { heading: 'Events', items: [{ href: '/d' }] },
];
const listed = new Set(['a', 'b', 'c', 'd']);

describe('serviceCount', () => {
  it('counts distinct listed projects across the named categories', () => {
    expect(serviceCount(['Strategic Branding', 'Graphic Design'], sections, listed)).toBe(3);
  });
  it('ignores unlisted projects, links without a page and unknown categories', () => {
    expect(serviceCount(['Strategic Branding', 'Nope'], sections, listed)).toBe(2);
    expect(serviceCount([], sections, listed)).toBe(0);
  });
  it('counts one category', () => {
    expect(categoryCount('Events', sections, listed)).toBe(1);
  });
});
