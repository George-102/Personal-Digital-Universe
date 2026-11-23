import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import WritingSection from '@/components/WritingSection';
import WritingVisual from '@/components/WritingVisual';
import WritingInteractions from '@/components/WritingInteractions';
import { writing } from '@/content/index';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
import '@/components/writing-page.css';

/** US-014d：英文 Writing 列表路由（[locale]/layout.tsx 已预生成 en）。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Writing' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/en/writing/` },
  };
}

export default async function LocaleWritingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <>
      <SiteNav lang="en" />
      <main>
        <WritingInteractions count={writing.length}>
          <WritingSection lang="en" standalone visual={<WritingVisual lang="en" />} />
        </WritingInteractions>
      </main>
      <SiteFooter lang="en" languageName={t('languageName')} languageHref="/writing/" />
    </>
  );
}
