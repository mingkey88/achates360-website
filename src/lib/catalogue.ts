import { projectIndex, type GalleryItem, type IndexEntry } from './project-index';
import mannhummelCard from '../assets/mannhummel-card.jpg';

/**
 * Card pictures that need a hand-made version, by project. Mann+Hummel's gallery picture is a 16:9 title
 * screen whose "MH INNOVATES 2026" sits at the left, so 4:3 cards cut off "MH" and tall phone cards cut
 * the title; its card version adds soft extensions of its own (blurred) picture above and below, so 4:3
 * cards show it whole, and tall cards anchored at the left keep the full title (client, 16 Oct 2026).
 */
const CARD_ART: Record<string, { thumb: ImageMetadata; position?: string }> = {
  mannhummel: { thumb: mannhummelCard, position: 'left' },
};

/** The /projects catalogue (projectIndex) with any hand-made card pictures in place. */
export function catalogueOf(gallery: GalleryItem[], projects: Map<string, { listed: boolean; copyright?: string }>): IndexEntry[] {
  return projectIndex(gallery, projects).map((e) => (CARD_ART[e.slug] ? { ...e, ...CARD_ART[e.slug] } : e));
}
