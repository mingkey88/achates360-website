import { describe, it, expect } from 'vitest';
import { listPlaceholders, assertPublishable, phAttr } from './placeholders';

const groups = {
  services: [{ id: 'branding', placeholder: true }, { id: 'digital', placeholder: false }],
  strings: [{ id: 'wordmark', placeholder: false }, { id: 'hero-sticker', placeholder: true }],
};

describe('listPlaceholders', () => {
  it('lists group/id of every placeholder item, sorted', () => {
    expect(listPlaceholders(groups)).toEqual(['services/branding', 'strings/hero-sticker']);
  });
  it('is empty when nothing is a placeholder', () => {
    expect(listPlaceholders({ a: [{ id: 'x', placeholder: false }] })).toEqual([]);
  });
});

describe('assertPublishable', () => {
  it('allows placeholders on staging', () => {
    expect(() => assertPublishable(groups, 'staging')).not.toThrow();
  });
  it('blocks a production build and names every placeholder', () => {
    expect(() => assertPublishable(groups, 'production')).toThrow(/services\/branding[\s\S]*strings\/hero-sticker/);
  });
  it('allows production once every item is approved', () => {
    expect(() => assertPublishable({ a: [{ id: 'x', placeholder: false }] }, 'production')).not.toThrow();
  });
});

describe('phAttr', () => {
  it('marks placeholders only', () => {
    expect(phAttr(true)).toEqual({ 'data-placeholder': '' });
    expect(phAttr(false)).toEqual({});
  });
});
