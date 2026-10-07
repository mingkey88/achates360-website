import { describe, it, expect } from 'vitest';
import { makeText } from './strings';

const text = makeText([{ id: 'wordmark', text: 'ACHATES 360', placeholder: false }]);

describe('makeText', () => {
  it('returns the string entry by id', () => {
    expect(text('wordmark')).toEqual({ id: 'wordmark', text: 'ACHATES 360', placeholder: false });
  });
  it('fails the build on an unknown id, naming the file to edit', () => {
    expect(() => text('nope')).toThrow(/"nope".*strings\.yaml/);
  });
});
