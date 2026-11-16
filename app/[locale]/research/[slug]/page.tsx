import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { research } from '@/content/index';
import { findResearchBySlug, researchDetailHref } from '@/lib/research';
import ResearchDetail from '@/components/ResearchDetail';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';

type Params = { locale: string; slug: string };

/** US-010e：英文详情路由；[locale]/layout.tsx 已预生成 en。 */
export function generateStaticParams(): Params[] {
  return research.map((item) => ({ locale: 'en', slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = findResearchBySlug(research, slug);
  if (!item) return {};
  const t = await getTranslations({ locale, namespace: 'Research' });
  const lang = locale === 'zh' ? 'zh' : 'en';
  const title = `${item.title[lang]} — ${t('routeTitle')}`;
  return {
    title,
    description: item.overview[lang],
    openGraph: {
      title,
      description: item.overview[lang],
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}${researchDetailHref(item.slug, 'en')}` },
  };
}

export default async function LocaleResearchDetailPage({
  params,
}: Readonly<{ params: Promise<Params> }>) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item = findResearchBySlug(research, slug);
  if (!item) notFound();
  const lang = locale === 'zh' ? 'zh' : 'en';
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <>
      <SiteNav lang={lang} />
      <main>
        <ResearchDetail item={item} lang={lang} />
      </main>
      <SiteFooter
        lang={lang}
        languageName={t('languageName')}
        languageHref={
          locale === 'zh' ? `/en/research/${item.slug}/` : `/research/${item.slug}/`
        }
      />
    </>
  );
}
