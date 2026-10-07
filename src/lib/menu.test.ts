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
