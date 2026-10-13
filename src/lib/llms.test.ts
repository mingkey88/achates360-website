import { describe, expect, it } from 'vitest';
import { lead, llmsTxt, plain } from './llms';

describe('plain', () => {
  it('keeps link words and drops markdown marks', () => {
    expect(plain('##### Hello **there** [site](https://x.y)\n\nnext\u200b')).toBe('Hello there site next');
  });
});

describe('lead', () => {
  it('stops at a sentence boundary within the limit, but always gives one sentence', () => {
    expect(lead('One two. Three four five. Six.', 12)).toBe('One two.');
    expect(lead('A very long first sentence indeed.', 5)).toBe('A very long first sentence indeed.');
  });
});

describe('llmsTxt', () => {
  const txt = llmsTxt({
    summary: 'A creative agency.', about: ['We design.'], homeUrl: 'https://a.b/', email: 'hi@a.b',
    pages: [{ name: 'About', url: 'https://a.b/about' }],
    services: [{ name: 'Branding', categories: ['Strategic Branding'] }],
    clients: ['DBS', 'Samsung'],
    projects: [{ title: 'Notter', url: 'https://a.b/notter', client: 'Artisan Super Food', year: '2020', categories: ['Packaging & Merchandise'], lead: 'Nuts.' }],
  });
  it('opens with the name and a one-line summary, as llmstxt.org asks', () => {
    expect(txt.startsWith('# Achates 360\n\n> A creative agency.\n')).toBe(true);
  });
  it('lists each case study with its client, year, categories and lead', () => {
    expect(txt).toContain('- [Notter](https://a.b/notter): Artisan Super Food, 2020 (Packaging & Merchandise). Nuts.');
  });
  it('includes contact, pages, services and clients', () => {
    for (const s of ['- Email: hi@a.b', '- [About](https://a.b/about)', '- Branding: Strategic Branding', 'DBS, Samsung']) expect(txt).toContain(s);
  });
});
