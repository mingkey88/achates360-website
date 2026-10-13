import { describe, expect, it } from 'vitest';
import { cutLines, cutSize } from './cut-lines';

describe('cutLines', () => {
  it('keeps short headings on one line', () => {
    expect(cutLines('PROJECTS', 13)).toEqual(['PROJECTS']);
    expect(cutLines('SOCIAL MEDIA', 13)).toEqual(['SOCIAL MEDIA']);
  });
  it('breaks longer ones between words', () => {
    expect(cutLines('STRATEGIC BRANDING', 13)).toEqual(['STRATEGIC', 'BRANDING']);
    expect(cutLines('DIGITAL COMMUNICATIONS', 13)).toEqual(['DIGITAL', 'COMMUNICATIONS']);
  });
  it('keeps an ampersand with the line before it', () => {
    expect(cutLines('PACKAGING & MERCHANDISE', 13)).toEqual(['PACKAGING &', 'MERCHANDISE']);
    expect(cutLines('ADVERTISING & PROMOTIONS', 13)).toEqual(['ADVERTISING &', 'PROMOTIONS']);
  });
  it('ignores stray spaces', () => {
    expect(cutLines('  GRAPHIC   DESIGN ', 20)).toEqual(['GRAPHIC DESIGN']);
  });
});

describe('cutSize', () => {
  it('fits the longest line to the width, up to the cap', () => {
    expect(cutSize(['PROJECTS'], 900, 166)).toBe(166);
    expect(cutSize(['DIGITAL', 'COMMUNICATIONS'], 840, 166)).toBe(100);
  });
});
