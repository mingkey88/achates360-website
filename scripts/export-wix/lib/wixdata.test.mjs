import { describe, it, expect } from 'vitest';
import { findRoutes, findGalleries, normalizeGalleryItem } from './wixdata.mjs';

const viewerModel = {
  siteFeaturesConfigs: { router: { routes: {
    './': { type: 'Static', pageId: 'home1' },
    './dxv': { type: 'Static', pageId: 'csao3' },
    './grab-brand-app-campaign': { type: 'Static', pageId: 'zencg' },
  } } },
};

const warmup = {
  appsWarmupData: { 'some-app': {
    'comp-kvlz5tvj_galleryData': { items: [{ itemId: 'a' }, { itemId: 'b' }] },
    'comp-kvm06g1x_galleryData': { items: [{ itemId: 'c' }] },
  } },
};

describe('findRoutes', () => {
  it('maps pageIds to paths wherever the routes object sits', () => {
    const r = findRoutes(viewerModel);
    expect(r.get('csao3')).toBe('/dxv');
    expect(r.get('zencg')).toBe('/grab-brand-app-campaign');
    expect(r.get('home1')).toBe('/');
  });
});

describe('findGalleries', () => {
  it('collects every *_galleryData by component id', () => {
    const g = findGalleries(warmup);
    expect([...g.keys()].sort()).toEqual(['comp-kvlz5tvj', 'comp-kvm06g1x']);
    expect(g.get('comp-kvlz5tvj').map((i) => i.itemId)).toEqual(['a', 'b']);
  });
});

describe('normalizeGalleryItem', () => {
  const routes = findRoutes(viewerModel);

  it('normalises an image item with an internal page link', () => {
    const item = {
      itemId: '82188cef', mediaUrl: '9766c0_bcbb~mv2.jpg',
      metaData: { title: 'Grab Brand App Campaign', description: 'Grab, Singapore', alt: 'Grab_x.jpg',
        link: { type: 'wix', data: { pageId: '#zencg', type: 'PageLink' } } },
    };
    expect(normalizeGalleryItem(item, routes)).toEqual({
      itemId: '82188cef', title: 'Grab Brand App Campaign', description: 'Grab, Singapore',
      href: '/grab-brand-app-campaign', file: '9766c0_bcbb~mv2.jpg', alt: 'Grab_x.jpg', video: null,
    });
  });

  it('normalises a video item from its posters and qualities', () => {
    const item = {
      itemId: '08e050a9',
      metaData: { title: 'DXV Microsite & Design Inspiration Book', description: 'LIXIL, DXV', type: 'video',
        link: { type: 'wix', data: { pageId: '#csao3' } },
        posters: [{ url: '9766c0_d765f000.jpg' }, { url: '9766c0_d765f003.jpg' }],
        qualities: [{ quality: '720p' }, { quality: '480p' }] },
    };
    const n = normalizeGalleryItem(item, routes);
    expect(n.href).toBe('/dxv');
    expect(n.file).toBe('9766c0_d765f000.jpg');
    expect(n.video).toEqual({ videoId: '9766c0_d765', quality: '720p' });
  });

  it('leaves href null when the link target is unknown, and keeps external URLs', () => {
    const dead = { itemId: 'x', mediaUrl: 'f.jpg', metaData: { link: { data: { pageId: '#gone' } } } };
    expect(normalizeGalleryItem(dead, routes).href).toBeNull();
    const ext = { itemId: 'y', mediaUrl: 'f.jpg', metaData: { link: { url: 'https://vimeo.com/1' } } };
    expect(normalizeGalleryItem(ext, routes).href).toBe('https://vimeo.com/1');
    const none = { itemId: 'z', mediaUrl: 'f.jpg', metaData: {} };
    expect(normalizeGalleryItem(none, routes)).toMatchObject({ href: null, title: '', description: '', alt: '' });
  });
});
