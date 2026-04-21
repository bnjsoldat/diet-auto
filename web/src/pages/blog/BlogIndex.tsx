import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock } from 'lucide-react';
import { BLOG_POSTS } from './posts';

export function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10 text-center">
        <div className="inline-flex h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 grid place-items-center mb-3">
          <BookOpen size={22} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Le blog</h1>
        <p className="muted mt-2 max-w-lg mx-auto">
          Calcul calorique, macros, perte de poids, sport, anti-régime… On décortique les
          sujets les plus courants, avec des calculs concrets et pas de baratin marketing.
        </p>
      </header>

      <div className="grid gap-4">
        {BLOG_POSTS.map((post) => {
          const datePretty = new Date(post.meta.publishedAt + 'T12:00:00').toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          return (
            <Link
              key={post.meta.slug}
              to={`/blog/${post.meta.slug}`}
              className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all block"
            >
              <h2 className="font-semibold text-lg">{post.meta.title}</h2>
              <p className="text-sm muted mt-1.5 line-clamp-2">{post.meta.description}</p>
              <div className="mt-3 flex items-center gap-4 text-xs muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} /> {datePretty}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} /> {post.meta.readingMinutes} min
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
