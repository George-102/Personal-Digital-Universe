import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function RootPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p>{t('tagline')}</p>
          <p className="font-mono text-sm">{t('status')}</p>
          <Link href="/en/">{t('languageName')}</Link>
        </main>
      </body>
    </html>
  );
}