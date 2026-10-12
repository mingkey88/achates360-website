import { describe, it, expect } from 'vitest';
import { withServices } from './menu';

const menu = [{ label: 'HOME', href: '/' }, { label: 'PROJECTS', href: '/projects', items: [{ label: 'Notter', href: '/notter' }] }, { label: 'CONTACT', href: '/#contact' }];

describe('withServices', () => {
  it('inserts SERVICES right after PROJECTS', () => {
    expect(withServices(menu, 'SERVICES').map((m) => m.label)).toEqual(['HOME', 'PROJECTS', 'SERVICES', 'CONTACT']);
  });
  it('does not change the menu it was given', () => {
    withServices(menu, 'SERVICES');
    expect(menu).toHaveLength(3);
  });
  it('is idempotent when the menu already links /services', () => {
    const once = withServices(menu, 'SERVICES');
    expect(withServices(once, 'SERVICES')).toEqual(once);
  });
  it('appends when there is no PROJECTS item', () => {
    expect(withServices([{ label: 'HOME', href: '/' }], 'SERVICES').at(-1)).toEqual({ label: 'SERVICES', href: '/services' });
  });
});

import { withContactPage } from './menu';
describe('withContactPage', () => {
  it('points the old home-page contact anchor at the contact page', () => {
    const out = withContactPage(menu);
    expect(out[2]).toEqual({ label: 'CONTACT', href: '/contact' });
    expect(out[0]).toBe(menu[0]);
  });
  it('leaves other links alone', () => {
    expect(withContactPage([{ label: 'HOME', href: '/' }])).toEqual([{ label: 'HOME', href: '/' }]);
  });
});
