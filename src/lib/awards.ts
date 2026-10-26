import aDesign from '../assets/wix/e9d9c2_71e753b0256d42769e9d4a6ff0107d5b.jpg';
import sbaBookOfYear from '../assets/wix/e9d9c2_138a012b672543c6be29449f97ae4b83.jpg';
import sbaWinner from '../assets/wix/e9d9c2_874f4fa961624d00b7cb519ddf23048e.jpg';
import sbaFinalist from '../assets/wix/e9d9c2_e6aea344f1a84e4cb767697022e345ca.jpg';
import how from '../assets/wix/e9d9c2_ae3d08e15bb941e286ec172544272fdd.jpg';
import gdusa from '../assets/wix/e9d9c2_c396404bb75c48a4aa853d3aa8c2c8b0.jpg';
import gov from '../assets/wix/e9d9c2_92810ae250b04ec1a5ca44e641d2aecb.jpg';
import hongKong from '../assets/wix/e9d9c2_779557ad8d434171a96ceced0dadc43c.jpg';
import newYork from '../assets/wix/e9d9c2_82689079ca644ca3b0e7ac477c805391.jpg';
import london from '../assets/wix/e9d9c2_28a6aa4434cc412187c1cadb7673fb0e.jpg';

/**
 * The pictures for the awards on About (client, 26 Oct 2026: "more pictures rather than just texts"),
 * keyed by each award exactly as the awards line names it. badge: the award's own seal, from the case
 * study that shows it ('Building Memories' carries ten); project: the work that won it, whose picture
 * stands in where there is no seal (The Paperweight Awards 2014 went to the 2013 Journal of Aviation
 * Management). An award with neither (Prime Design Mark: no seal or project on the site, CONTENT-QUERIES
 * 67) is set as type alone.
 */
export const AWARDS: Record<string, { badge?: ImageMetadata; project?: string }> = {
  'GDUSA American Graphic Design Award 2016 Winner': { badge: gdusa, project: 'building-memories-artbook' },
  '2016 GOV Design Awards Gold': { badge: gov, project: 'building-memories-artbook' },
  '2016 Hong Kong Design Awards Gold': { badge: hongKong, project: 'building-memories-artbook' },
  '2016 New York Design Awards Gold': { badge: newYork, project: 'building-memories-artbook' },
  '2016 London Design Awards Silver': { badge: london, project: 'building-memories-artbook' },
  "A' Design Award Winner 2017 Bronze": { badge: aDesign, project: 'building-memories-artbook' },
  'Prime Design Mark': {},
  'HOW International Design Awards Winner': { badge: how, project: 'building-memories-artbook' },
  'Singapore Book Awards 2017 Book of the Year': { badge: sbaBookOfYear, project: 'building-memories-artbook' },
  'Singapore Book Awards 2017 Finalist, Best Book Cover Design': { badge: sbaFinalist, project: 'building-memories-artbook' },
  'Singapore Book Awards 2017 Winner, Best Illustrated Non-Fiction Title': { badge: sbaWinner, project: 'building-memories-artbook' },
  'The Paperweight Awards 2014': { project: 'journal-of-aviation-management' },
};
