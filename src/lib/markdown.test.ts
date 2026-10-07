import { describe, it, expect } from 'vitest';
import { renderMd } from './markdown';

const B = '/achates360-website';

describe('renderMd', () => {
  it('prefixes internal links with the base', () => {
    expect(renderMd('[All Projects](/projects)', B)).toContain('href="/achates360-website/projects"');
  });
  it('leaves mailto, tel and external links alone', () => {
    const html = renderMd('[a](mailto:x@y.com) [b](tel:+65123) [c](https://vimeo.com/1)', B);
    expect(html).toContain('href="mailto:x@y.com"');
    expect(html).toContain('href="tel:+65123"');
    expect(html).toContain('href="https://vimeo.com/1"');
  });
  it('opens external http(s) links in a new tab, as Wix does', () => {
    expect(renderMd('[Kinokuniya](https://singapore.kinokuniya.com/bw/9789811823077)', B)).toBe(
      '<p><a target="_blank" rel="noopener noreferrer" href="https://singapore.kinokuniya.com/bw/9789811823077">Kinokuniya</a></p>\n');
    expect(renderMd('[**bold** site](http://example.com "T")', B)).toBe(
      '<p><a target="_blank" rel="noopener noreferrer" href="http://example.com" title="T"><strong>bold</strong> site</a></p>\n');
  });
  it('keeps internal, mailto and tel links in the same tab', () => {
    const html = renderMd('[a](/projects) [b](mailto:x@y.com) [c](tel:+65123) [d](#top)', B);
    expect(html).not.toContain('target=');
  });
  it('renders escaped characters back to the verbatim text', () => {
    expect(renderMd('Selection 2\\* Required', B)).toBe('<p>Selection 2* Required</p>\n');
  });
  it('renders headings and hard breaks', () => {
    expect(renderMd('## Title', B)).toBe('<h2>Title</h2>\n');
    expect(renderMd('**Job Description**  \nThe Account Executive', B)).toBe('<p><strong>Job Description</strong><br>The Account Executive</p>\n');
  });
});

describe('renderMd and no-break spaces', () => {
  it('keeps a line holding only a no-break space after a hard break', () => {
    expect(renderMd('industries.  \n\u00a0', B)).toBe('<p>industries.<br>&nbsp;</p>\n');
  });
  it('keeps no-break spaces inside text', () => {
    expect(renderMd('a\u00a0b', B)).toBe('<p>a&nbsp;b</p>\n');
  });
});

describe('renderMd demote', () => {
  it('shifts heading levels so page structure keeps one h1', () => {
    expect(renderMd('# Red Packets', '/', { demote: 2 })).toContain('<h3');
  });
  it('never goes past h6', () => {
    expect(renderMd('##### Contact', '/', { demote: 3 })).toContain('<h6');
  });
  it('leaves headings alone by default', () => {
    expect(renderMd('# Join us', '/')).toContain('<h1');
  });
});
