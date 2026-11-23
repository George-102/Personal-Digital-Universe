import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { writing } from '@/content/index';
import { findWritingBySlug, writingDetailHref } from '@/lib/writing';
import WritingDetail from '@/components/WritingDetail';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
import '@/components/writing-page.css';

type Params = { locale: string; slug: string };

/** US-014e：英文详情路由；[locale]/layout.tsx 已预生成 en。 */
export function generateStaticParams(): Params[] {
  return writing.map((item) => ({ locale: 'en', slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = findWritingBySlug(writing, slug);
  if (!item) return {};
  const t = await getTranslations({ locale, namespace: 'Writing' });
  const title = `${item.title.en} — ${t('detailPageLabel')}`;
  return {
    title,
    description: item.description.en,
    openGraph: {
      title,
      description: item.description.en,
      type: 'article',
    },
    alternates: { canonical: `${SITE_URL}${writingDetailHref(item.slug, 'en')}` },
  };
}

export default async function LocaleWritingDetailPage({
  params,
}: Readonly<{ params: Promise<Params> }>) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item = findWritingBySlug(writing, slug);
  if (!item) notFound();
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <>
      <SiteNav lang="en" />
      <main>
        <WritingDetail item={item} lang="en" />
      </main>
      <SiteFooter
        lang="en"
        languageName={t('languageName')}
        languageHref={`/writing/${item.slug}/`}
      />
    </>
  );
}
