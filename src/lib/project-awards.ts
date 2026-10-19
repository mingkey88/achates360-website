/**
 * Award seals shown beside a project where the homepage features it (SelectedWork's lead plate). The
 * badges are the project page's own (its Wix gallery), named as the page names them; count is the number
 * of awards the page lists. Seals: the round medallions (shown in a circle); badges: the rest. All are
 * shown at one visual weight, in one grid.
 */
import sbpaYear from '../assets/wix/e9d9c2_138a012b672543c6be29449f97ae4b83.jpg';
import sbpaWinner from '../assets/wix/e9d9c2_874f4fa961624d00b7cb519ddf23048e.jpg';
import sbpaFinalist from '../assets/wix/e9d9c2_e6aea344f1a84e4cb767697022e345ca.jpg';
import how from '../assets/wix/e9d9c2_ae3d08e15bb941e286ec172544272fdd.jpg';
import gdusa from '../assets/wix/e9d9c2_c396404bb75c48a4aa853d3aa8c2c8b0.jpg';
import aDesign from '../assets/wix/e9d9c2_71e753b0256d42769e9d4a6ff0107d5b.jpg';
import gov from '../assets/wix/e9d9c2_92810ae250b04ec1a5ca44e641d2aecb.jpg';
import hkg from '../assets/wix/e9d9c2_779557ad8d434171a96ceced0dadc43c.jpg';
import nyc from '../assets/wix/e9d9c2_82689079ca644ca3b0e7ac477c805391.jpg';
import lon from '../assets/wix/e9d9c2_28a6aa4434cc412187c1cadb7673fb0e.jpg';

export interface Badge { src: ImageMetadata; alt: string }
export interface ProjectAwards { count: number; seals: Badge[]; badges: Badge[] }

export const PROJECT_AWARDS: Record<string, ProjectAwards> = {
  'building-memories-artbook': {
    count: 10,
    seals: [
      { src: sbpaYear, alt: 'Singapore Book Awards 2017: Book of the Year' },
      { src: sbpaWinner, alt: 'Singapore Book Awards 2017: Winner, Best Illustrated Non-Fiction Title' },
      { src: sbpaFinalist, alt: 'Singapore Book Awards 2017: Finalist, Best Book Cover Design' },
    ],
    badges: [
      { src: how, alt: 'HOW International Design Awards Winner 2017' },
      { src: gdusa, alt: 'American Graphic Design Award 2016 Winner' },
      { src: aDesign, alt: "A' Design Award 2017 Bronze Winner" },
      { src: gov, alt: 'GOV: The Design 100 Gold Winner 2016' },
      { src: hkg, alt: 'HKG: The Design 100 Gold Winner 2016' },
      { src: nyc, alt: 'NYC: The Design 100 Gold Winner 2016' },
      { src: lon, alt: 'LON: The Design 100 Silver Winner 2016' },
    ],
  },
};
