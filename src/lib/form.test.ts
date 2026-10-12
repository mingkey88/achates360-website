import { describe, expect, it } from 'vitest';
import { mergeContinuationGroups } from './form';

const services = { name: 'a', label: 'Services you are looking at?', required: true, options: ['Branding', 'Events'] };
const overflow = { name: 'b', label: 'Selection 2', required: true, options: ['Animation', 'Others'] };

describe('mergeContinuationGroups', () => {
  it('joins a "Selection N" group onto the group before it', () => {
    expect(mergeContinuationGroups([services, overflow])).toEqual([
      { ...services, options: ['Branding', 'Events', 'Animation', 'Others'] },
    ]);
  });
  it('keeps groups with real labels apart', () => {
    const budget = { name: 'c', label: 'Budget', required: false, options: ['Small'] };
    expect(mergeContinuationGroups([services, budget])).toHaveLength(2);
  });
  it('keeps a leading "Selection N" group as it is (nothing to join it to)', () => {
    expect(mergeContinuationGroups([overflow])).toEqual([overflow]);
  });
  it('does not change the groups it was given', () => {
    const input = [services, overflow];
    mergeContinuationGroups(input);
    expect(services.options).toEqual(['Branding', 'Events']);
  });
});
