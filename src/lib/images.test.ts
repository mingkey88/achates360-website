import { describe, it, expect } from 'vitest';
import { isGif } from './images';

const meta = (over: Record<string, unknown>) => ({ src: '/x', width: 1, height: 1, format: 'jpg', ...over }) as unknown as ImageMetadata;

describe('isGif', () => {
  it('reads the file path when there is one', () => {
    expect(isGif(meta({ fsPath: '/a/b/anim.GIF', format: 'jpg' }))).toBe(true);
    expect(isGif(meta({ fsPath: '/a/b/photo.jpg', format: 'gif' }))).toBe(false);
  });
  it('falls back to the format', () => {
    expect(isGif(meta({ format: 'gif' }))).toBe(true);
    expect(isGif(meta({ format: 'png' }))).toBe(false);
  });
});
