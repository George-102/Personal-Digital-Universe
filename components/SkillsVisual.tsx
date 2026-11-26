import { getTranslations } from 'next-intl/server';
import SkillsCanvas from '@/components/SkillsCanvas';
import { skills } from '@/content/index';
import { SKILL_CATEGORIES } from '@/lib/skills';

/**
 * US-007f：3D 技能星图概念视觉层。只由 /skills 列表页引入，
 * 首页不加载客户端 3D 模块（US-010k TBT 教训）。
 * PRD 红线：概念性标注与 DOM 信息同在，3D 层 aria-hidden 纯装饰。
 */
export default async function SkillsVisual({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Skills' });
  // 只把领域计数送进 client chunk，不把技能文案打进 3D bundle
  const counts = SKILL_CATEGORIES.map(
    (category) => skills.filter((item) => item.category === category).length,
  );

  return (
    <div className="skills-visual-row">
      <div className="skills-visual" aria-hidden="true" data-skills-visual>
        <SkillsCanvas counts={counts} />
      </div>
      <p className="skills-concept-note" data-skills-concept-note>
        {t('conceptNote')}
      </p>
    </div>
  );
}
