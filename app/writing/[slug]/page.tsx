import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { writing } from '@/content/index';
import { findWritingBySlug, writingDetailHref } from '@/lib/writing';
import WritingDetail from '@/components/WritingDetail';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
import '@/components/writing-page.css';

type Params = { slug: string };

/** US-014e：中文详情路由（静态导出目录形式）。 */
export function generateStaticParams(): Params[] {
  return writing.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = findWritingBySlug(writing, slug);
  if (!item) return {};
  const t = await getTranslations({ locale: 'zh', namespace: 'Writing' });
  const title = `${item.title.zh} — ${t('detailPageLabel')}`;
  return {
    title,
    description: item.description.zh,
    openGraph: {
      title,
      description: item.description.zh,
      type: 'article',
    },
    alternates: { canonical: `${SITE_URL}${writingDetailHref(item.slug, 'zh')}` },
  };
}

export default async function WritingDetailPage({
  params,
}: Readonly<{ params: Promise<Params> }>) {
  const { slug } = await params;
  const item = findWritingBySlug(writing, slug);
  if (!item) notFound();
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <WritingDetail item={item} lang="zh" />
        </main>
        <SiteFooter
          lang="zh"
          languageName={t('languageName')}
          languageHref={`/en/writing/${item.slug}/`}
        />
      </body>
    </html>
  );
}
