import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { research } from '@/content/index';
import { findResearchBySlug, researchDetailHref } from '@/lib/research';
import ResearchDetail from '@/components/ResearchDetail';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';

type Params = { slug: string };

/** US-010e：中文详情路由，按 public research 的 slug 静态预生成。 */
export function generateStaticParams(): Params[] {
  return research.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = findResearchBySlug(research, slug);
  if (!item) return {};
  const t = await getTranslations({ locale: 'zh', namespace: 'Research' });
  const title = `${item.title.zh} — ${t('routeTitle')}`;
  return {
    title,
    description: item.overview.zh,
    openGraph: {
      title,
      description: item.overview.zh,
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}${researchDetailHref(item.slug, 'zh')}` },
  };
}

export default async function ResearchDetailPage({
  params,
}: Readonly<{ params: Promise<Params> }>) {
  const { slug } = await params;
  const item = findResearchBySlug(research, slug);
  if (!item) notFound();
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <ResearchDetail item={item} lang="zh" />
        </main>
        <SiteFooter
          lang="zh"
          languageName={t('languageName')}
          languageHref={`/en/research/${item.slug}/`}
        />
      </body>
    </html>
  );
}
