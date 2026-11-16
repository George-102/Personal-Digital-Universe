import { getTranslations } from 'next-intl/server';
import ResearchCanvas from '@/components/ResearchCanvas';

/**
 * US-010f/k：3D 空域概念示意（纯视觉层）。只由 /research 列表页通过 prop 传入
 * ResearchSection，首页不引入该客户端模块，避免首屏 TBT 回归。
 * PRD 红线：概念性标注与 DOM 信息同在，3D 层 aria-hidden。
 */
export default async function ResearchVisual({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Research' });

  return (
    <div className="research-visual-row mt-6">
      <div className="research-visual" aria-hidden="true" data-research-visual>
        <ResearchCanvas requireLeftHero={false} />
      </div>
      <p className="research-concept-note" data-research-concept-note>
        {t('conceptNote')}
      </p>
    </div>
  );
}
