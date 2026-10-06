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
  filter: (node) => node.nodeName === 'SPAN' && /font-weight:\s*(bold|[6-9]00)/.test(node.getAttribute('style') || ''),
  replacement: (content) => (content.trim() ? `**${content}**` : content),
});

td.addRule('normalisedLinks', {
  filter: (node) => node.nodeName === 'A' && node.getAttribute('href'),
  replacement: (content, node) => `[${content}](${normalizeHref(node.getAttribute('href'))})`,
});

export function htmlToMarkdown(html) {
  const $ = cheerio.load(`<div id="root">${html}</div>`, null, false);
  $('#root p, #root h1, #root h2, #root h3, #root h4, #root h5, #root h6').each((_, el) => {
    if (isSpacer($(el).text())) $(el).remove();
  });
  return td.turndown($('#root').html() ?? '').trim();
}
