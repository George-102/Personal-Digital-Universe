import { profile } from '@/content/profile';

export default function PersonJsonLd() {
  if (!profile.public) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name.en,
    alternateName: profile.name.zh,
    description: profile.tagline.en,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    sameAs: profile.links.map((l) => l.url),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}