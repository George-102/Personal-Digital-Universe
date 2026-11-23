import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { writing } from '@/content/index';
import { writingStatusKey, writingDetailHref, writingHref } from '@/lib/writing';
import type { WritingStatus, WritingWork } from '@/content/types';

type Props = {
  lang: 'zh' | 'en';
  /** 独立 /writing 列表页用 h1；首页 section 用 h2 */
  standalone?: boolean;
  /** 首页精简模式：只展示 featured 精选，详情与世界设定留到列表页/详情页（TBT 红线） */
  compact?: boolean;
  /** 3D 书架视觉层（仅列表页传入；首页不引入客户端 3D 模块） */
  visual?: ReactNode;
};

const STATUS_KEY: Record<WritingStatus, string> = {
  Writing: 'statusWriting',
  'In Progress': 'statusInProgress',
  Completed: 'statusCompleted',
};

const DEFAULT_COVER = 'writing-cover--placeholder';

/**
 * US-014c：文学作品。数据来自 content/index.ts（已过滤 public），
 * 服务端渲染成静态 HTML：无 JS / 无 WebGL 时名称、简介、状态与详情全文可读。
 * 3D 层（US-014f）是 aria-hidden 概念视觉，不承载信息。
 */
export default async function WritingSection({
  lang,
  standalone = false,
  compact = false,
  visual,
}: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Writing' });
  const items = compact ? writing.filter((item) => item.featured).slice(0, 2) : writing;
  if (items.length === 0) return null;

  const Heading = standalone ? 'h1' : 'h2';

  const renderCard = (item: WritingWork) => {
    if (compact) {
      return (
        <li
          key={item.slug}
          className="writing-card"
          data-writing-item
          data-writing-slug={item.slug}
          data-writing-status={writingStatusKey(item.status)}
          data-writing-featured={item.featured ? 'true' : 'false'}
        >
          <h3 className="writing-name" data-writing-name>
            {item.title[lang]}
          </h3>
          <p className="writing-description" data-writing-description>
            {item.description[lang]}
          </p>
          <span className="writing-status" data-writing-status-label={writingStatusKey(item.status)}>
            {t(STATUS_KEY[item.status])}
          </span>
        </li>
      );
    }

    const hasCover = Boolean(item.cover);
    return (
      <li
        key={item.slug}
        className="writing-card"
        data-writing-item
        data-writing-slug={item.slug}
        data-writing-status={writingStatusKey(item.status)}
        data-writing-featured={item.featured ? 'true' : 'false'}
        data-writing-has-cover={hasCover ? 'true' : 'false'}
      >
        <a className="writing-cover-link" href={writingDetailHref(item.slug, lang)}>
          <div
            className={`writing-cover ${hasCover ? '' : DEFAULT_COVER}`}
            data-writing-image
            aria-hidden="true"
            style={hasCover ? { backgroundImage: `url("${item.cover}")` } : undefined}
          />
          {!hasCover && <span className="sr-only">{t('defaultCoverNote')}</span>}
        </a>
        <div className="writing-card-head">
          <h3 className="writing-name" data-writing-name>
            <a href={writingDetailHref(item.slug, lang)} data-writing-detail>
              {item.title[lang]}
            </a>
          </h3>
          <span className="writing-status" data-writing-status-label={writingStatusKey(item.status)}>
            {t(STATUS_KEY[item.status])}
          </span>
        </div>
        <p className="writing-meta" data-writing-meta>
          <span>{item.type === 'novel' ? t('typeNovel') : t('typeArticle')}</span>
          {item.writtenAt && <span>{item.writtenAt}</span>}
        </p>
        <p className="writing-description" data-writing-description>
          {item.description[lang]}
        </p>
      </li>
    );
  };

  return (
    <section
      id="writing"
      data-writing-section
      className="writing-section mx-auto w-full max-w-5xl scroll-mt-24 px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <Heading className="mt-3 text-2xl font-semibold sm:text-3xl">{t('title')}</Heading>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/75">{t('intro')}</p>
      {!standalone && (
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink/60">{t('listIntro')}</p>
      )}

      {visual}

      <ul className="writing-list" data-writing-list aria-label={t('listLabel')}>
        {items.map(renderCard)}
      </ul>

      {!standalone && (
        <p className="mt-8">
          <a className="writing-all-link" data-writing-all href={writingHref(lang)}>
            {t('viewAll')}
          </a>
        </p>
      )}
    </section>
  );
}
