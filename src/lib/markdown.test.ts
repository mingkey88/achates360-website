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
  it('renders escaped characters back to the verbatim text', () => {
    expect(renderMd('Selection 2\\* Required', B)).toBe('<p>Selection 2* Required</p>\n');
  });
  it('renders headings and hard breaks', () => {
    expect(renderMd('## Title', B)).toBe('<h2>Title</h2>\n');
    expect(renderMd('**Job Description**  \nThe Account Executive', B)).toBe('<p><strong>Job Description</strong><br>The Account Executive</p>\n');
  });
});
