import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function Home({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p>{t('tagline')}</p>
      <p className="font-mono text-sm">{t('status')}</p>
      <Link href={locale === 'zh' ? '/en/' : '/'}>{t('languageName')}</Link>
    </main>
  );
}