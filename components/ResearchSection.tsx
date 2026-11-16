import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { research } from '@/content/index';
import { researchDetailHref, researchHref } from '@/lib/research';

type Props = {
  lang: 'zh' | 'en';
  /** 独立 /research 列表页用 h1；首页 section 用 h2（全页仍只有一个 h1） */
  standalone?: boolean;
  /**
   * 首页精简模式：只保留方向、概述与核心问题（PRD 验收 1）；
   * 方法、关键词与 3D 空域示意完整保留在 /research 列表与详情页，
   * 降低首页 RSC/DOM 体积与客户端 hydration（US-010k TBT）。
   */
  compact?: boolean;
  /** 3D 概念示意（仅 /research 列表页传入；首页不引入客户端 3D 模块） */
  visual?: ReactNode;
};

/**
 * US-010c：科研方向。数据来自 content/research.ts，服务端渲染成静态 HTML，
 * 无 JS / 无 WebGL 时全部信息可读（PRD 验收 1/4）。3D 空域示意（US-010f）只是视觉层。
 */
export default async function ResearchSection({
  lang,
  standalone = false,
  compact = false,
  visual,
}: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Research' });
  const items = research;
  if (items.length === 0) return null;

  const Heading = standalone ? 'h1' : 'h2';

  return (
    <section
      id="research"
      data-research-section
      className="research-section mx-auto w-full max-w-4xl scroll-mt-24 px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <Heading className="mt-3 text-2xl font-semibold sm:text-3xl">{t('title')}</Heading>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/75">{t('intro')}</p>
      {!standalone && (
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink/60">{t('listIntro')}</p>
      )}

      {/* US-010f/k：3D 空域概念示意只由 /research 列表页传入，首页不引入客户端 3D 模块 */}
      {visual}

      <ul className="research-list mt-8" aria-label={t('listLabel')} data-research-list>
        {items.map((item) => (
          <li
            key={item.slug}
            className="research-card"
            data-research-item
            data-research-slug={item.slug}
          >
            <div className="research-card-head">
              <h3 className="research-title">{item.title[lang]}</h3>
              <span
                className="research-status"
                data-research-status={item.status === 'In Progress' ? 'in-progress' : 'completed'}
              >
                {item.status === 'In Progress' ? t('statusInProgress') : t('statusCompleted')}
              </span>
            </div>

            <p className="research-overview" data-research-overview>
              {item.overview[lang]}
            </p>

            <div className="research-block">
              <p className="research-label">{t('problemsLabel')}</p>
              <ul className="research-problems" data-research-problems>
                {item.problems.map((problem, index) => (
                  <li key={index}>{problem[lang]}</li>
                ))}
              </ul>
            </div>

            {!compact && (
              <>
                <div className="research-block">
                  <p className="research-label">{t('methodsLabel')}</p>
                  <ul className="research-chips" data-research-methods>
                    {item.methods.map((method) => (
                      <li key={method} className="research-chip">
                        {method}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="research-block">
                  <p className="research-label">{t('keywordsLabel')}</p>
                  <ul className="research-chips" data-research-keywords>
                    {item.keywords.map((keyword) => (
                      <li key={keyword} className="research-chip research-chip-keyword">
                        {keyword}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <a
              className="research-detail-link"
              data-research-detail-link
              href={researchDetailHref(item.slug, lang)}
            >
              {t('viewDetail')}
            </a>
          </li>
        ))}
      </ul>

      {!standalone && (
        <p className="mt-8">
          <a className="research-all-link" data-research-all href={researchHref(lang)}>
            {t('viewAll')}
          </a>
        </p>
      )}
    </section>
  );
}
