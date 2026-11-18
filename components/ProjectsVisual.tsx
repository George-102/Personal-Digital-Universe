import { getTranslations } from 'next-intl/server';
import ProjectsCanvas from '@/components/ProjectsCanvas';
import { projects } from '@/content/index';

/**
 * US-012g：3D 浮动卡片概念视觉层。只由 /projects 列表页引入，
 * 首页不加载客户端 3D 模块（US-010k TBT 教训）。
 * PRD 红线：概念性标注与 DOM 信息同在，3D 层 aria-hidden 纯装饰。
 */
export default async function ProjectsVisual({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Projects' });

  return (
    <div className="projects-visual-row">
      <div className="projects-visual" aria-hidden="true" data-projects-visual>
        <ProjectsCanvas count={projects.length} />
      </div>
      <p className="projects-concept-note" data-projects-concept-note>
        {t('conceptNote')}
      </p>
    </div>
  );
}
