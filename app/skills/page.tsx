import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SkillsSection from '@/components/SkillsSection';
import SkillsInteractions from '@/components/SkillsInteractions';
import { skills } from '@/content/index';
import SkillsVisual from '@/components/SkillsVisual';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
// 全量卡与 3D 视觉层样式按路由加载（不进首页全局表，TBT 红线）
import '@/components/skills-page.css';

/** US-007d：中文 Skills 列表路由（独立 html/body，与 /products 同构）。 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'zh', namespace: 'Skills' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/skills/` },
  };
}

export default async function SkillsPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <SkillsInteractions count={skills.length}>
            <SkillsSection lang="zh" standalone visual={<SkillsVisual lang="zh" />} />
          </SkillsInteractions>
        </main>
        <SiteFooter lang="zh" languageName={t('languageName')} languageHref="/en/skills/" />
      </body>
    </html>
  );
}
