import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ResearchSection from '@/components/ResearchSection';
import ResearchVisual from '@/components/ResearchVisual';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';

/** US-010d：中文 Research 列表路由。根布局只返回 children，页面自带 html/body（与 app/contact/page.tsx 同构）。 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'zh', namespace: 'Research' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/research/` },
  };
}

export default async function ResearchPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <ResearchSection
            lang="zh"
            standalone
            visual={<ResearchVisual lang="zh" />}
          />
        </main>
        <SiteFooter
          lang="zh"
          languageName={t('languageName')}
          languageHref="/en/research/"
        />
      </body>
    </html>
  );
}
