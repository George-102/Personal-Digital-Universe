import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { profile } from '@/content/profile';

export default async function RootPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">{profile.name.zh}</h1>
          <p>{profile.tagline.zh}</p>
          <p className="font-mono text-sm">{profile.status.zh}</p>
          <p className="text-sm opacity-70">{t('tagline')}</p>
          <Link href="/en/">{t('languageName')}</Link>
        </main>
      </body>
    </html>
  );
}