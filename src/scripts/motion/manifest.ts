import type { PageKind } from '../../lib/page-kind';
export type MotionModule = 'reveal' | 'stack' | 'counters' | 'tilt' | 'scatter' | 'press' | 'story';

/** Which motion modules each page kind loads (spec §5: case studies only get the light reveals). */
export const MOTION: Record<PageKind, MotionModule[]> = {
  home: ['reveal', 'counters', 'scatter'],
  project: ['reveal'],
  projects: ['reveal', 'tilt'],
  categories: ['reveal', 'tilt'],
  services: ['reveal', 'tilt', 'press'],
  about: ['reveal', 'counters', 'story'],
  joinus: ['reveal'],
  page: ['reveal'],
  card: [],
};

/** The template that builds each page kind (where its motion <script> lives). */
export const SOURCES: Record<PageKind, string> = {
  home: 'src/pages/index.astro',
  project: 'src/layouts/Project.astro',
  projects: 'src/pages/projects.astro',
  categories: 'src/layouts/Categories.astro',
  services: 'src/pages/services.astro',
  about: 'src/layouts/About.astro',
  joinus: 'src/layouts/JoinUs.astro',
  page: 'src/layouts/Page.astro',
  card: 'src/layouts/Card.astro',
};
