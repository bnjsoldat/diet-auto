import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findPostBySlug } from './posts';

/**
 * Met à jour dynamiquement les balises `<meta>` quand l'utilisateur est
 * déjà sur le site. Les bots sociaux (Facebook, Twitter, LinkedIn) eux ne
 * voient *pas* ces updates (ils ne lancent pas le JS), donc pour un vrai
 * OG par article il faudrait un SSG. En attendant, ça suffit pour les
 * utilisateurs qui partagent depuis leur navigateur.
 */
function setMetaContent(selector: string, content: string): string {
  const el = document.querySelector<HTMLMetaElement>(selector);
  const prev = el?.getAttribute('content') ?? '';
  if (el) el.setAttribute('content', content);
  return prev;
}

function setLinkHref(selector: string, href: string): string {
  const el = document.querySelector<HTMLLinkElement>(selector);
  const prev = el?.getAttribute('href') ?? '';
  if (el) el.setAttribute('href', href);
  return prev;
}

/**
 * Page dynamique qui charge le bon article selon le slug dans l'URL.
 * Si slug inconnu → redirect vers /blog. Met à jour le title + meta
 * description + OG/Twitter tags + canonical pour le SEO, et injecte un
 * JSON-LD Article pour les rich snippets Google.
 */
export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? findPostBySlug(slug) : undefined;

  useEffect(() => {
    if (!post) return;
    const prevTitle = document.title;
    const articleUrl = `https://madiet.lentreprise.ai/blog/${post.meta.slug}`;
    document.title = `${post.meta.title} — Ma Diét`;

    // Meta description + canonical
    const prevDesc = setMetaContent('meta[name="description"]', post.meta.description);
    const prevCanonical = setLinkHref('link[rel="canonical"]', articleUrl);

    // Open Graph (Facebook, LinkedIn, WhatsApp, Slack…)
    const prevOgTitle = setMetaContent(
      'meta[property="og:title"]',
      `${post.meta.title} — Ma Diét`
    );
    const prevOgDesc = setMetaContent(
      'meta[property="og:description"]',
      post.meta.description
    );
    const prevOgUrl = setMetaContent('meta[property="og:url"]', articleUrl);
    const prevOgType = setMetaContent('meta[property="og:type"]', 'article');

    // Twitter Card
    const prevTwTitle = setMetaContent(
      'meta[name="twitter:title"]',
      `${post.meta.title} — Ma Diét`
    );
    const prevTwDesc = setMetaContent(
      'meta[name="twitter:description"]',
      post.meta.description
    );

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
        '@id': articleUrl,
      },
      keywords: post.meta.keywords.join(', '),
      image: 'https://madiet.lentreprise.ai/og-image.png',
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevDesc) setMetaContent('meta[name="description"]', prevDesc);
      if (prevCanonical) setLinkHref('link[rel="canonical"]', prevCanonical);
      if (prevOgTitle) setMetaContent('meta[property="og:title"]', prevOgTitle);
      if (prevOgDesc) setMetaContent('meta[property="og:description"]', prevOgDesc);
      if (prevOgUrl) setMetaContent('meta[property="og:url"]', prevOgUrl);
      if (prevOgType) setMetaContent('meta[property="og:type"]', prevOgType);
      if (prevTwTitle) setMetaContent('meta[name="twitter:title"]', prevTwTitle);
      if (prevTwDesc) setMetaContent('meta[name="twitter:description"]', prevTwDesc);
      ld.remove();
    };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const { Component } = post;
  return <Component />;
}
