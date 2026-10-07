import { describe, it, expect } from 'vitest';
import { sentenceStarting, splitRoleHeading, titleFromSeo } from './copy';

const about = 'We are an integrated creative agency.  \n \n\nThe name Achates 360 reflects our company philosophy of being a faithful companion and trusted friend to our clients. Relationships are central to our company\'s ethos.  \n​\n\nBelieving that design is thinking made visual.';

describe('sentenceStarting', () => {
  it('returns the first sentence of the paragraph that starts with the prefix, verbatim', () => {
    expect(sentenceStarting(about, 'The name Achates 360')).toBe('The name Achates 360 reflects our company philosophy of being a faithful companion and trusted friend to our clients.');
  });
  it('is null when no paragraph starts with the prefix', () => {
    expect(sentenceStarting(about, 'Since starting')).toBeNull();
  });
});

describe('splitRoleHeading', () => {
  it('takes the first heading as the role title without markdown markers', () => {
    const md = '#### **CLIENT ACCOUNT EXECUTIVE / MANAGER** \n\n**Job Description**\n\nThe Account Executive…';
    expect(splitRoleHeading(md)).toEqual({ title: 'CLIENT ACCOUNT EXECUTIVE / MANAGER', rest: '**Job Description**\n\nThe Account Executive…' });
  });
  it('is null without a heading', () => expect(splitRoleHeading('Just text')).toBeNull());
});

describe('titleFromSeo', () => {
  it('drops the site suffix', () => expect(titleFromSeo('Project Categories | Achates 360')).toBe('Project Categories'));
  it('keeps a title without a suffix', () => expect(titleFromSeo('Projects')).toBe('Projects'));
});
