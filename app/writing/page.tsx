import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import WritingSection from '@/components/WritingSection';
import WritingVisual from '@/components/WritingVisual';
import WritingInteractions from '@/components/WritingInteractions';
import { writing } from '@/content/index';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
// 全量卡与 3D 视觉层样式按路由加载（不进首页全局表，TBT 红线）
import '@/components/writing-page.css';

/** US-014d：中文 Writing 列表路由（与 /products 同构：页面自带 html/body）。 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'zh', namespace: 'Writing' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/writing/` },
  };
}

export default async function WritingPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <WritingInteractions count={writing.length}>
            <WritingSection lang="zh" standalone visual={<WritingVisual lang="zh" />} />
          </WritingInteractions>
        </main>
        <SiteFooter lang="zh" languageName={t('languageName')} languageHref="/en/writing/" />
      </body>
    </html>
  );
}
