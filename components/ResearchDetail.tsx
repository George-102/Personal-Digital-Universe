import { getTranslations } from 'next-intl/server';
import type { ResearchArea } from '@/content/types';
import { researchHref } from '@/lib/research';

type Props = {
  item: ResearchArea;
  lang: 'zh' | 'en';
};

/**
 * US-010e：研究方向详情。阅读优先的纯 DOM 内容（不做常驻 3D），
 * 无 JS 状态下全文可读；状态徽标严格区分 In Progress / Completed（PRD 验收 5）。
 */
export default async function ResearchDetail({ item, lang }: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Research' });

  return (
    <article
      data-research-detail
      data-research-slug={item.slug}
      className="research-section mx-auto w-full max-w-3xl px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <h1 className="mt-3 text-3xl font-semibold">{item.title[lang]}</h1>
      <p className="mt-3">
        <span
          className="research-status"
          data-research-status={item.status === 'In Progress' ? 'in-progress' : 'completed'}
        >
          {item.status === 'In Progress' ? t('statusInProgress') : t('statusCompleted')}
        </span>
      </p>

      <section className="research-block mt-8">
        <h2 className="research-label">{t('overviewLabel')}</h2>
        <p className="research-overview" data-research-overview>
          {item.overview[lang]}
        </p>
      </section>

      <section className="research-block mt-8">
        <h2 className="research-label">{t('problemsLabel')}</h2>
        <ul className="research-problems" data-research-problems>
          {item.problems.map((problem, index) => (
            <li key={index}>{problem[lang]}</li>
          ))}
        </ul>
      </section>

      <section className="research-block mt-8">
        <h2 className="research-label">{t('methodsLabel')}</h2>
        <ul className="research-chips" data-research-methods>
          {item.methods.map((method) => (
            <li key={method} className="research-chip">
              {method}
            </li>
          ))}
        </ul>
      </section>

      <section className="research-block mt-8">
        <h2 className="research-label">{t('keywordsLabel')}</h2>
        <ul className="research-chips" data-research-keywords>
          {item.keywords.map((keyword) => (
            <li key={keyword} className="research-chip research-chip-keyword">
              {keyword}
            </li>
          ))}
        </ul>
      </section>

      {item.detail && item.detail.length > 0 && (
        <section className="research-block mt-8">
          <h2 className="research-label">{t('detailLabel')}</h2>
          <div className="research-detail-copy" data-research-copy>
            {item.detail.map((paragraph, index) => (
              <p key={index} className="research-overview">
                {paragraph[lang]}
              </p>
            ))}
          </div>
        </section>
      )}

      {item.link && (
        <p className="mt-8">
          <a
            className="research-detail-link"
            data-research-external
            href={item.link}
            target={item.link.startsWith('http') ? '_blank' : undefined}
            rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {item.link}
          </a>
        </p>
      )}

      <p className="mt-10">
        <a className="research-back-link" data-research-back href={researchHref(lang)}>
          {t('backToList')}
        </a>
      </p>
    </article>
  );
}
