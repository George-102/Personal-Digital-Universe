import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ResearchSection from '@/components/ResearchSection';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';

/** US-010d：英文 Research 列表路由；[locale]/layout.tsx 已预生成 en。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Research' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/en/research/` },
  };
}

export default async function LocaleResearchPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale === 'zh' ? 'zh' : 'en';
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <>
      <SiteNav lang={lang} />
      <main>
        <ResearchSection lang={lang} standalone />
      </main>
      <SiteFooter
        lang={lang}
        languageName={t('languageName')}
        languageHref={locale === 'zh' ? '/en/research/' : '/research/'}
      />
    </>
  );
}
