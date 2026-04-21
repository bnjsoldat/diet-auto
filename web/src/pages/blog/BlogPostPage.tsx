import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findPostBySlug } from './posts';

/**
 * Page dynamique qui charge le bon article selon le slug dans l'URL.
 * Si slug inconnu → redirect vers /blog. Met à jour le title + meta
 * description de façon dynamique pour le SEO sans router lib
 * supplémentaire.
 */
export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? findPostBySlug(slug) : undefined;

  useEffect(() => {
    if (!post) return;
    const prevTitle = document.title;
    document.title = `${post.meta.title} — Ma Diét`;
    // Met à jour la meta description
    let meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') ?? '';
    if (meta) meta.setAttribute('content', post.meta.description);

    // Canonical URL vers l'article
    let canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute('href') ?? '';
    if (canonical) canonical.setAttribute('href', `https://madiet.lentreprise.ai/blog/${post.meta.slug}`);

    // JSON-LD Article pour rich snippets Google
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'blog-article-ld';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.meta.title,
      description: post.meta.description,
      datePublished: post.meta.publishedAt,
      dateModified: post.meta.publishedAt,
      author: { '@type': 'Organization', name: 'Ma Diét' },
      publisher: {
        '@type': 'Organization',
        name: 'Ma Diét',
        logo: {
          '@type': 'ImageObject',
          url: 'https://madiet.lentreprise.ai/icon-512.svg',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://madiet.lentreprise.ai/blog/${post.meta.slug}`,
      },
      keywords: post.meta.keywords.join(', '),
      image: 'https://madiet.lentreprise.ai/og-image.png',
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (meta && prevDesc) meta.setAttribute('content', prevDesc);
      if (canonical && prevCanonical) canonical.setAttribute('href', prevCanonical);
      ld.remove();
    };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const { Component } = post;
  return <Component />;
}
