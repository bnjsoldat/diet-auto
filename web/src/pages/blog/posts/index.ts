import type { ComponentType } from 'react';
import type { BlogPostMeta } from '../BlogLayout';
import Calorique, { meta as caloriqueMeta } from './besoin-calorique';
import Perdre5kg, { meta as perdre5kgMeta } from './perdre-5-kg';
import PriseDeMasse, { meta as priseDeMasseMeta } from './prise-de-masse';
import Reequilibrage, { meta as reequilibrageMeta } from './reequilibrage-alimentaire';
import Macros, { meta as macrosMeta } from './macros-musculation';
import Endurance, { meta as enduranceMeta } from './nutrition-endurance';

export interface BlogPost {
  meta: BlogPostMeta;
  Component: ComponentType;
}

/**
 * Registre central des articles. Plus simple qu'un système dynamique
 * (pas de MDX, pas de import.meta.glob) : chaque article est un
 * composant TSX classique référencé ici. Ordre = du plus récent
 * au plus ancien.
 */
export const BLOG_POSTS: BlogPost[] = [
  { meta: enduranceMeta, Component: Endurance },
  { meta: macrosMeta, Component: Macros },
  { meta: reequilibrageMeta, Component: Reequilibrage },
  { meta: priseDeMasseMeta, Component: PriseDeMasse },
  { meta: perdre5kgMeta, Component: Perdre5kg },
  { meta: caloriqueMeta, Component: Calorique },
];

export function findPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.meta.slug === slug);
}
