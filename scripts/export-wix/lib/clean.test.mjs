import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, isSpacer } from './clean.mjs';

describe('isSpacer', () => {
  it('treats empty and invisible-only paragraphs as spacers', () => {
    expect(isSpacer('')).toBe(true);
    expect(isSpacer('​')).toBe(true);
    expect(isSpacer('   ')).toBe(true);
    expect(isSpacer('﻿​')).toBe(true);
  });
  it('keeps anything with visible characters', () => {
    expect(isSpacer('© 2018')).toBe(false);
    expect(isSpacer('About this video ​')).toBe(false);
    expect(isSpacer('.')).toBe(false);
  });
});

describe('htmlToMarkdown', () => {
  it('keeps headings, paragraphs and copy verbatim', () => {
    const html = '<h2 class="font_2"><span>DBS Discretionary Portfolio Management</span></h2>'
      + '<p class="font_8"><span>In today’s volatile world: even the savviest investor…</span></p>';
    expect(htmlToMarkdown(html)).toBe(
      '## DBS Discretionary Portfolio Management\n\nIn today’s volatile world: even the savviest investor…');
  });

  it('drops spacer paragraphs between content', () => {
    const html = '<p>First</p><p>​</p><p><span>​</span></p><p>Second</p>';
    expect(htmlToMarkdown(html)).toBe('First\n\nSecond');
  });

  it('normalises internal links and keeps mailto/tel/external verbatim', () => {
    const html = '<p><a href="https://www.achates360.com/projects">All Projects</a> '
      + '<a href="mailto:jamillie@achates360.com?subject=From%20e-card">angeline@achates360.com</a> '
      + '<a href="https://drivenxdesign.com/NYC21/project.asp?ID=22036">NY DRIVENxDESIGN</a></p>';
    expect(htmlToMarkdown(html)).toBe(
      '[All Projects](/projects) [angeline@achates360.com](mailto:jamillie@achates360.com?subject=From%20e-card) '
      + '[NY DRIVENxDESIGN](https://drivenxdesign.com/NYC21/project.asp?ID=22036)');
  });

  it('keeps bold spans and line breaks', () => {
    const html = '<p><span style="font-weight:bold;">Job Description</span><br>The Account Executive</p>';
    expect(htmlToMarkdown(html)).toBe('**Job Description**  \nThe Account Executive');
  });

  it('does not escape copy into something different when rendered', () => {
    const html = '<p>1 Irving Place, #05-02</p><p>Selection 2* Required</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('#05-02');
    expect(md.replace(/\\/g, '')).toBe('1 Irving Place, #05-02\n\nSelection 2* Required');
  });

  it('preserves media-only paragraphs (linked images, iframes, videos, svgs)', () => {
    const html = '<p><a href="https://www.achates360.com/a"><img src="x.jpg"></a></p><p>t</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('/a');
    expect(md).toContain('t');
  });

  it('maps italic spans to emphasis (the closing paragraph of /the-brooks-clown)', () => {
    const html = '<p class="font_8" style="font-size:15px;"><span style="font-style:italic;" class="wixui-rich-text__text">Hear from Marc (Hatoff) about Singapore’s landmark, Haw Par Villa.</span></p>';
    expect(htmlToMarkdown(html)).toBe('*Hear from Marc (Hatoff) about Singapore’s landmark, Haw Par Villa.*');
  });
  it('keeps spaces outside the emphasis and leaves upright text alone', () => {
    expect(htmlToMarkdown('<p>Read <span style="font-style: italic"> this </span>now <span style="font-style:normal">plain</span></p>'))
      .toBe('Read *this* now plain');
  });
  it('avoids doubled emphasis from italic ancestors', () => {
    expect(htmlToMarkdown('<p><em><span style="font-style:italic">X</span></em></p>')).toBe('*X*');
    expect(htmlToMarkdown('<p><span style="font-style:italic"><span style="font-style:italic">Y</span></span></p>')).toBe('*Y*');
  });
  it('avoids doubled bold from nested strong/b ancestors', () => {
    const html = '<p><strong><span style="font-weight:bold">Both</span></strong></p>';
    expect(htmlToMarkdown(html)).toBe('**Both**');
  });

  it('avoids doubled bold from nested bold-styled span ancestors', () => {
    const html = '<p><span style="font-weight:bold"><span style="font-weight:bold">X</span></span></p>';
    expect(htmlToMarkdown(html)).toBe('**X**');
  });
});
