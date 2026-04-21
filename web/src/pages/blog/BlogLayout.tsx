import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import type { ReactNode } from 'react';

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO 'YYYY-MM-DD'
  readingMinutes: number;
  /** Keywords pour SEO / tags visuels. */
  keywords: string[];
}

/**
 * Layout partagé par tous les articles de blog : en-tête avec breadcrumb,
 * méta (date + durée lecture), contenu typo riche, footer avec CTA retour
 * vers l'app.
 *
 * La prop children reçoit le contenu de l'article (formaté en JSX avec
 * typographie Tailwind — on évite MDX pour garder la stack simple et
 * le bundle léger).
 */
export function BlogLayout({
  meta,
  children,
}: {
  meta: BlogPostMeta;
  children: ReactNode;
}) {
  const datePretty = new Date(meta.publishedAt + 'T12:00:00').toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm muted hover:text-[var(--text)] mb-6"
      >
        <ArrowLeft size={14} /> Retour au blog
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            {meta.title}
          </h1>
          <div className="mt-4 flex items-center gap-4 text-xs muted">
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} /> {datePretty}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {meta.readingMinutes} min de lecture
            </span>
          </div>
        </header>

        <div className="prose-article">{children}</div>

        <hr className="my-10 border-[var(--border)]" />

        <div className="card p-6 text-center bg-gradient-to-br from-emerald-50/60 dark:from-emerald-950/30 to-transparent">
          <h2 className="font-semibold text-lg">Envie d'appliquer ça concrètement ?</h2>
          <p className="text-sm muted mt-1">
            Ma Diét calcule ton besoin calorique et optimise tes quantités automatiquement.
            Gratuit, sans inscription obligatoire.
          </p>
          <Link to="/today" className="btn-primary mt-4 inline-flex">
            Commencer mon plan →
          </Link>
        </div>
      </article>
    </div>
  );
}
