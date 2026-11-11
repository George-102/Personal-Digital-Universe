import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeSections from '@/components/HomeSections';
import PersonJsonLd from '@/components/PersonJsonLd';

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
      <main>
        <HomeSections lang={lang} />
      </main>
      <footer className="px-6 py-8 text-center text-sm opacity-60">
        <Link href={locale === 'zh' ? '/en/' : '/'}>{t('languageName')}</Link>
      </footer>
    </>
  );
}