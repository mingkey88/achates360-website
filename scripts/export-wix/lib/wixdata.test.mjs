import { describe, it, expect } from 'vitest';
import { findRoutes, findGalleries, findGalleryItems, normalizeGalleryItem } from './wixdata.mjs';

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

describe('normalizeGalleryItem: link shapes', () => {
  const routes = findRoutes(viewerModel);
  it('reads the real external-link shape link.data.url and normalises it', () => {
    const item = { itemId: 's', mediaUrl: 'f.png', metaData: { title: 'Samsung The Freestyle',
      link: { type: 'wix', data: { type: 'ExternalLink', url: 'https://www.achates360.com/samsung-the-freestyle' } } } };
    expect(normalizeGalleryItem(item, routes).href).toBe('/samsung-the-freestyle');
  });
});

describe('findGalleryItems', () => {
  it('collects embedded {itemId, metaData} items anywhere in an object', () => {
    const found = findGalleryItems([{ deep: warmup }, { x: { itemId: 'q', metaData: { title: 'Q' } } }]);
    expect(found.map((i) => i.itemId)).toEqual(['q']);
  });
  it('converts pro-gallery-webapp items (the network shape) into the embedded shape', () => {
    const body = { gallery: { id: 'g', totalItemsCount: 2, items: [
      { id: 'p1', mediaUrl: 'https://static.wixstatic.com/media/e9d9c2_06b3~mv2.png', title: 'Photo', description: 'Achates 360',
        alt: 'P.png', dataType: 'Photo',
        link: { type: 'Internal', url: 'https://www.achates360.com//dxv', wixLinkData: { page: { pageId: '#csao3' } } } },
      { id: 'v1', mediaUrl: 'https://video.wixstatic.com/video/483e3e_a341/360p/mp4/file.mp4', title: 'GROHE Quarterly Campaigns',
        description: 'LIXIL, GROHE', dataType: 'Video',
        link: { type: 'Internal', url: 'https://www.achates360.com//grohe', wixLinkData: { page: { pageId: '#gone' } } },
        videoMetadata: { posters: [{ url: 'https://static.wixstatic.com/media/483e3e_a341f000.jpg' }],
          resolutions: [{ videoMode: '360p' }] } },
    ] } };
    const routes = findRoutes(viewerModel);
    const [p, v] = findGalleryItems([body]).map((i) => normalizeGalleryItem(i, routes));
    expect(p).toEqual({ itemId: 'p1', title: 'Photo', description: 'Achates 360', href: '/dxv',
      file: 'e9d9c2_06b3~mv2.png', alt: 'P.png', video: null });
    expect(v).toMatchObject({ itemId: 'v1', title: 'GROHE Quarterly Campaigns', href: '/grohe',
      file: '483e3e_a341f000.jpg', video: { videoId: '483e3e_a341', quality: '360p' } });
  });
});
