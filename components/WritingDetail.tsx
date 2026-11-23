import { getTranslations } from 'next-intl/server';
import type { WritingWork } from '@/content/types';
import { writingHref, writingStatusKey } from '@/lib/writing';

type Props = {
  item: WritingWork;
  lang: 'zh' | 'en';
};

const STATUS_KEY: Record<WritingWork['status'], string> = {
  Writing: 'statusWriting',
  'In Progress': 'statusInProgress',
  Completed: 'statusCompleted',
};

/**
 * US-014e：作品详情。阅读优先的纯 DOM 内容（不做常驻 3D），
 * 无 JS 状态下全文可读；状态徽标严格区分 Writing / In Progress / Completed（PRD 验收 5）。
 */
export default async function WritingDetail({ item, lang }: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Writing' });
  const status = writingStatusKey(item.status);

  return (
    <article
      data-writing-detail
      data-writing-slug={item.slug}
      className="writing-section writing-detail mx-auto w-full max-w-3xl px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <h1 className="mt-3 text-3xl font-semibold" data-writing-detail-title>
        {item.title[lang]}
      </h1>
      <p className="mt-3">
        <span className="writing-detail-status" data-writing-status={status}>
          {t(STATUS_KEY[item.status])}
        </span>
      </p>
      <p className="writing-meta mt-3" data-writing-meta>
        <span>{item.type === 'novel' ? t('typeNovel') : t('typeArticle')}</span>
        {item.writtenAt && (
          <span>
            {t('createdAtLabel')} · {item.writtenAt}
          </span>
        )}
      </p>
      <p className="mt-6 text-[15px] leading-7 text-ink/80" data-writing-description>
        {item.description[lang]}
      </p>

      {item.worldview && (
        <section className="writing-detail-block">
          <h2 className="writing-detail-label">{t('worldviewLabel')}</h2>
          <p className="mt-3 leading-7 text-ink/80" data-writing-worldview>
            {item.worldview[lang]}
          </p>
        </section>
      )}

      {item.background && item.background.length > 0 && (
        <section className="writing-detail-block">
          <h2 className="writing-detail-label">{t('backgroundLabel')}</h2>
          <ul className="mt-3 space-y-2 leading-7 text-ink/80" data-writing-background>
            {item.background.map((paragraph, index) => (
              <li key={index}>{paragraph[lang]}</li>
            ))}
          </ul>
        </section>
      )}

      {item.characters && item.characters.length > 0 && (
        <section className="writing-detail-block">
          <h2 className="writing-detail-label">{t('charactersLabel')}</h2>
          <ul className="mt-3 space-y-2 leading-7 text-ink/80" data-writing-characters>
            {item.characters.map((character, index) => (
              <li key={index}>{character[lang]}</li>
            ))}
          </ul>
        </section>
      )}

      {item.concept && (
        <section className="writing-detail-block">
          <h2 className="writing-detail-label">{t('conceptLabel')}</h2>
          <p className="mt-3 leading-7 text-ink/80" data-writing-concept>
            {item.concept[lang]}
          </p>
        </section>
      )}

      {item.detail && item.detail.length > 0 && (
        <section className="writing-detail-block">
          <h2 className="writing-detail-label">{t('detailLabel')}</h2>
          <div className="mt-3 space-y-3 leading-7 text-ink/80" data-writing-extra>
            {item.detail.map((paragraph, index) => (
              <p key={index}>{paragraph[lang]}</p>
            ))}
          </div>
        </section>
      )}

      {(item.readingUrl || item.externalUrl) && (
        <p className="mt-8">
          <a
            className="writing-detail-link"
            data-writing-reading
            href={item.readingUrl ?? item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('readingLabel')} ↗
          </a>
        </p>
      )}

      <p className="mt-8">
        <a className="writing-detail-back" data-writing-back href={writingHref(lang)}>
          ← {t('backToList')}
        </a>
      </p>
    </article>
  );
}
