import { describe, expect, it } from 'vitest';
import { morphName } from './morph';

describe('morphName', () => {
  it('names a project by its slug or link', () => {
    expect(morphName('dxv')).toBe('p-dxv');
    expect(morphName('/samsung-connected-home')).toBe('p-samsung-connected-home');
  });
  it('gives no name to anything that is not one project page', () => {
    expect(morphName(undefined)).toBeUndefined();
    expect(morphName('/projects/branding')).toBeUndefined();
    expect(morphName('https://example.com')).toBeUndefined();
    expect(morphName('/')).toBeUndefined();
  });
});
