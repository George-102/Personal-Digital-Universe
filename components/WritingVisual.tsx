import { getTranslations } from 'next-intl/server';
import WritingCanvas from '@/components/WritingCanvas';
import { writing } from '@/content/index';

/**
 * US-014f：3D 悬浮书架概念视觉层。只由 /writing 列表页引入，
 * 首页不加载客户端 3D 模块（US-010k/012j/013i TBT 教训）。
 * PRD 红线：概念性标注与 DOM 信息同在，3D 层 aria-hidden 纯装饰。
 */
export default async function WritingVisual({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Writing' });

  return (
    <div className="writing-visual-row">
      <div className="writing-visual" aria-hidden="true" data-writing-visual>
        <WritingCanvas count={writing.length} />
      </div>
      <p className="writing-visual-note" data-writing-concept-note>
        {t('conceptNote')}
      </p>
    </div>
  );
}
