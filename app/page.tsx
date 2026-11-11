import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HomeSections from '@/components/HomeSections';
import PersonJsonLd from '@/components/PersonJsonLd';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
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
        <SiteNav lang="zh" />
        <main>
          <HomeSections lang="zh" />
        </main>
        <SiteFooter lang="zh" languageName={t('languageName')} languageHref="/en/" />
      </body>
    </html>
  );
}
