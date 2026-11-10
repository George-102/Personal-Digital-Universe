import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { profile } from '@/content/profile';

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">{profile.name[lang]}</h1>
      <p>{profile.tagline[lang]}</p>
      <p className="font-mono text-sm">{profile.status[lang]}</p>
      <p className="text-sm opacity-70">{t('tagline')}</p>
      <Link href={locale === 'zh' ? '/en/' : '/'}>{t('languageName')}</Link>
    </main>
  );
}