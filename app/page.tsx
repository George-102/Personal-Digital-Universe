import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import HomeSections from '@/components/HomeSections';
import PersonJsonLd from '@/components/PersonJsonLd';
import { profile } from '@/content/profile';

export const metadata: Metadata = {
  title: `${profile.name.zh} — Personal Digital Universe`,
  description: `${profile.tagline.zh} ${profile.status.zh}`,
  openGraph: {
    title: `${profile.name.zh} — Personal Digital Universe`,
    description: profile.tagline.zh,
    type: 'profile',
  },
};

export default async function RootPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <PersonJsonLd />
        <main>
          <HomeSections lang="zh" />
        </main>
        <footer className="px-6 py-8 text-center text-sm opacity-60">
          <Link href="/en/">{t('languageName')}</Link>
        </footer>
      </body>
    </html>
  );
}