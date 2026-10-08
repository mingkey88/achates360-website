import { describe, it, expect } from 'vitest';
import { withBase, mediaUrl, backLinkHref, pagePath, menuCurrent, linkAttrs, isExternal } from './paths';

const B = '/achates360-website';

describe('withBase', () => {
  it('prefixes internal paths', () => {
    expect(withBase('/dxv', B)).toBe('/achates360-website/dxv');
  });
  it('maps home to the bare base', () => {
    expect(withBase('/', B)).toBe('/achates360-website');
  });
  it('keeps home as / when there is no base', () => {
    expect(withBase('/', '/')).toBe('/');
    expect(withBase('/dxv', '/')).toBe('/dxv');
  });
  it('tolerates a trailing slash on the base', () => {
    expect(withBase('/dxv', B + '/')).toBe('/achates360-website/dxv');
  });
  it('leaves mailto, tel, external and hash-only links alone', () => {
    expect(withBase('mailto:hello@achates360.com', B)).toBe('mailto:hello@achates360.com');
    expect(withBase('tel:+6598462443', B)).toBe('tel:+6598462443');
    expect(withBase('https://vimeo.com/x', B)).toBe('https://vimeo.com/x');
    expect(withBase('#contact', B)).toBe('#contact');
  });
});

describe('mediaUrl', () => {
  it('resolves a public media path under the base', () => {
    expect(mediaUrl('media/video/abc.mp4', B)).toBe('/achates360-website/media/video/abc.mp4');
    expect(mediaUrl('/cards/angeline.vcf', B)).toBe('/achates360-website/cards/angeline.vcf');
  });
});

describe('withBase with a home fragment', () => {
  it('keeps the fragment on the bare base', () => {
    expect(withBase('/#all-projects', B)).toBe('/achates360-website#all-projects');
    expect(withBase('/#all-projects', '/')).toBe('/#all-projects');
  });
});

describe('backLinkHref', () => {
  it('sends the home back link to the projects page', () => {
    expect(backLinkHref('/')).toBe('/projects');
  });
  it('leaves other targets alone', () => {
    expect(backLinkHref('/projects')).toBe('/projects');
    expect(backLinkHref('https://example.com')).toBe('https://example.com');
  });
});

describe('pagePath', () => {
  it('strips the base and the .html of build.format file', () => {
    expect(pagePath('/achates360-website/notter.html', B)).toBe('/notter');
    expect(pagePath('/achates360-website/index.html', B)).toBe('/');
    expect(pagePath('/achates360-website', B)).toBe('/');
  });
  it('works without a base and in dev (no .html)', () => {
    expect(pagePath('/notter', '/')).toBe('/notter');
    expect(pagePath('/', '/')).toBe('/');
    expect(pagePath('/achates360-website/notter', B)).toBe('/notter');
  });
  it('does not strip a base that is only a prefix of the first segment', () => {
    expect(pagePath('/achates360-website-x/notter', B)).toBe('/achates360-website-x/notter');
  });
});

describe('menuCurrent', () => {
  const projects = { href: '/projects', items: [{ href: '/notter' }] };
  it('marks the page itself and the parent of a sub-menu page', () => {
    expect(menuCurrent(projects, '/projects')).toBe('page');
    expect(menuCurrent(projects, '/notter')).toBe('parent');
    expect(menuCurrent({ href: '/' }, '/')).toBe('page');
    expect(menuCurrent({ href: '/#contact' }, '/')).toBeNull();
    expect(menuCurrent(projects, '/about')).toBeNull();
  });
});

describe('linkAttrs', () => {
  it('opens external http(s) links in a new tab without opener or referrer', () => {
    expect(linkAttrs('https://www.instagram.com/achates360/')).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
    expect(linkAttrs('http://www.singaporebookpublishers.sg/index.php')).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
  });
  it('leaves internal, anchor, mailto, tel and media links alone', () => {
    for (const h of ['/', '/projects', '/#all-projects', '#top', 'mailto:a@b.c', 'tel:+65', '/cards/angeline.vcf']) {
      expect(linkAttrs(h)).toEqual({});
      expect(isExternal(h)).toBe(false);
    }
  });
});
