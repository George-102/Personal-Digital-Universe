import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ProjectsSection from '@/components/ProjectsSection';
import ProjectsInteractions from '@/components/ProjectsInteractions';
import { projects } from '@/content/index';
import ProjectsVisual from '@/components/ProjectsVisual';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
// 全量卡与 3D 视觉层样式按路由加载（不进首页全局表，TBT 红线）
import '@/components/projects-page.css';

/** US-012e：中文 Projects 列表路由（与 /research 同构：页面自带 html/body）。 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'zh', namespace: 'Projects' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/projects/` },
  };
}

export default async function ProjectsPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <ProjectsInteractions count={projects.length}>
            <ProjectsSection lang="zh" standalone visual={<ProjectsVisual lang="zh" />} />
          </ProjectsInteractions>
        </main>
        <SiteFooter
          lang="zh"
          languageName={t('languageName')}
          languageHref="/en/projects/"
        />
      </body>
    </html>
  );
}
