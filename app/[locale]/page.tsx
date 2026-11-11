import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeSections from '@/components/HomeSections';
import PersonJsonLd from '@/components/PersonJsonLd';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export default async function Home({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const lang = locale === 'zh' ? 'zh' : 'en';

  return (
    <>
      <PersonJsonLd />
      <SiteNav lang={lang} />
      <main>
        <HomeSections lang={lang} />
      </main>
      <SiteFooter
        lang={lang}
        languageName={t('languageName')}
        languageHref={locale === 'zh' ? '/en/' : '/'}
      />
    </>
  );
}
