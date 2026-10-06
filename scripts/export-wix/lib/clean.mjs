import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { normalizeHref } from './urls.mjs';

/**
 * True when a paragraph is a Wix layout spacer rather than content.
 * Wix uses paragraphs holding only zero-width/non-breaking spaces as vertical spacing.
 */
export function isSpacer(text) {
  return /^[\s​ ﻿]*$/.test(text);
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*', br: '  ' });

td.addRule('boldSpan', {
  filter: (node) => {
    if (node.nodeName !== 'SPAN' || !/font-weight:\s*(bold|[6-9]00)/.test(node.getAttribute('style') || '')) {
      return false;
    }
    // Check for bold ancestors: strong, b, or bold-styled span
    let parent = node.parentNode;
    while (parent) {
      if (parent.nodeName === 'STRONG' || parent.nodeName === 'B') {
        return false;
      }
      if (parent.nodeName === 'SPAN' && /font-weight:\s*(bold|[6-9]00)/.test(parent.getAttribute('style') || '')) {
        return false;
      }
      parent = parent.parentNode;
    }
    return true;
  },
  replacement: (content) => (content.trim() ? `**${content}**` : content),
});

// Wix marks italic copy with a styled span (e.g. the closing paragraph of /the-brooks-clown).
const ITALIC = /font-style:\s*italic/;
td.addRule('italicSpan', {
  filter: (node) => {
    if (node.nodeName !== 'SPAN' || !ITALIC.test(node.getAttribute('style') || '')) return false;
    // An italic ancestor (em, i or another italic span) already emits the delimiters.
    for (let p = node.parentNode; p; p = p.parentNode) {
      if (p.nodeName === 'EM' || p.nodeName === 'I') return false;
      if (p.nodeName === 'SPAN' && ITALIC.test(p.getAttribute('style') || '')) return false;
    }
    return true;
  },
  // Delimiters hug the text: Markdown does not open emphasis before a space.
  replacement: (content) => {
    if (!content.trim()) return content;
    const [, lead, body, trail] = content.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return `${lead}*${body}*${trail}`;
  },
});

td.addRule('normalisedLinks', {
  filter: (node) => node.nodeName === 'A' && node.getAttribute('href'),
  replacement: (content, node) => `[${content}](${normalizeHref(node.getAttribute('href'))})`,
});

export function htmlToMarkdown(html) {
  const $ = cheerio.load(`<div id="root">${html}</div>`, null, false);
  $('#root p, #root h1, #root h2, #root h3, #root h4, #root h5, #root h6').each((_, el) => {
    if (isSpacer($(el).text())) {
      // Only remove if no media/link descendants
      const $el = $(el);
      const hasMedia = $el.find('img, iframe, video, svg').length > 0;
      const hasLink = $el.find('a[href]').length > 0;
      if (!hasMedia && !hasLink) {
        $el.remove();
      }
    }
  });
  return td.turndown($('#root').html() ?? '').trim();
}
