import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ContactSection from '@/components/ContactSection';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';

/** US-018j：英文 Contact 独立路由；[locale]/layout.tsx 已预生成 en。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/en/contact/` },
  };
}

export default async function LocaleContactPage({
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
        <ContactSection lang={lang} standalone />
      </main>
      <SiteFooter
        lang={lang}
        languageName={t('languageName')}
        languageHref={locale === 'zh' ? '/en/contact/' : '/contact/'}
      />
    </>
  );
}
