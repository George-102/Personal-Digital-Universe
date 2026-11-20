import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { products } from '@/content/index';
import { productHref, productStatusKey } from '@/lib/products';
import type { Product, ProductStatus } from '@/content/types';

type Props = {
  lang: 'zh' | 'en';
  /** 独立 /products 列表页用 h1；首页 section 用 h2 */
  standalone?: boolean;
  /** 首页精简模式：只展示 featured 精选，详情/功能列表留到列表页（US-010k TBT 教训） */
  compact?: boolean;
  /** 3D 产品展台视觉层（仅列表页传入；首页不引入客户端 3D 模块） */
  visual?: ReactNode;
};

const STATUS_KEY: Record<ProductStatus, string> = {
  Released: 'statusReleased',
  Beta: 'statusBeta',
  'In Development': 'statusInDevelopment',
  Discontinued: 'statusDiscontinued',
};

/** 统一默认封面占位（AC5：未配置图片时用 CSS 渐变，不发外部请求） */
const DEFAULT_COVER = 'product-cover--placeholder';

/**
 * US-013c：独立开发的软件产品。数据来自 content/index.ts（已过滤 public），
 * 服务端渲染成静态 HTML：无 JS / 无 WebGL 时名称、简介、状态与详情全部可读。
 * 3D 层（US-013f）是 aria-hidden 概念视觉，不承载信息。
 */
export default async function ProductsSection({
  lang,
  standalone = false,
  compact = false,
  visual,
}: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Products' });
  // US-010k/012j 红线：首页只放 2 张精选卡，全量与真实封面留在 /products 列表页
  const items = compact ? products.filter((item) => item.featured).slice(0, 2) : products;
  if (items.length === 0) return null;

  const Heading = standalone ? 'h1' : 'h2';

  const renderCard = (item: Product) => {
    // 首页 compact 卡：仅 name + 简介（TBT 红线——cover/功能/状态 chip 都进首屏 styleLayout）
    if (compact) {
      return (
        <li
          key={item.slug}
          className="product-card"
          data-product-item
          data-product-slug={item.slug}
          data-product-status={productStatusKey(item.status)}
          data-product-featured={item.featured ? 'true' : 'false'}
        >
          <h3 className="product-name" data-product-name>
            {item.name}
          </h3>
          <p className="product-description" data-product-description>
            {item.description[lang]}
          </p>
        </li>
      );
    }

    const hasCover = Boolean(item.cover || item.logo);
    const coverUrl = item.cover ?? item.logo;
    return (
      <li
        key={item.slug}
        className="product-card"
        data-product-item
        data-product-slug={item.slug}
        data-product-status={productStatusKey(item.status)}
        data-product-featured={item.featured ? 'true' : 'false'}
        data-product-has-cover={hasCover ? 'true' : 'false'}
      >
        <div
          className={`product-cover ${hasCover ? '' : DEFAULT_COVER}`}
          data-product-image
          aria-hidden="true"
          style={hasCover ? { backgroundImage: `url("${coverUrl}")` } : undefined}
        />
        {!hasCover && <span className="sr-only">{t('defaultCoverNote')}</span>}
        <div className="product-card-head">
          <h3 className="product-name" data-product-name>
            {item.name}
          </h3>
          <span className="product-status" data-product-status-label={productStatusKey(item.status)}>
            {t(STATUS_KEY[item.status])}
          </span>
        </div>
        <p className="product-description" data-product-description>
          {item.description[lang]}
        </p>

        {/* 列表页全量信息：核心功能 + 内联详情面板 */}
        <ul className="product-features" data-product-features aria-label={t('featuresLabel')}>
          {item.features.map((feature, index) => (
            <li key={index} className="product-feature-chip">
              {feature[lang]}
            </li>
          ))}
        </ul>

        <details className="product-details" data-product-details>
          <summary className="product-summary" data-product-expand>
            <span className="product-toggle-hint product-hint-expand">{t('expand')}</span>
            <span className="product-toggle-hint product-hint-collapse">{t('collapse')}</span>
          </summary>
          <div className="product-panel" data-product-detail>
            <p className="product-panel-label">{t('detailLabel')}</p>
            <p>{item.detail ? item.detail[lang] : item.description[lang]}</p>
            <p className="product-panel-links">
              {item.url && (
                <a
                  className="product-visit"
                  data-product-visit
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('visitLabel')}
                </a>
              )}
              {item.repo && (
                <a
                  className="product-repo"
                  data-product-repo
                  href={`https://github.com/${item.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('repoLabel')}
                </a>
              )}
            </p>
          </div>
        </details>
      </li>
    );
  };

  return (
    <section
      id="products"
      data-products-section
      className="products-section mx-auto w-full max-w-5xl scroll-mt-24 px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <Heading className="mt-3 text-2xl font-semibold sm:text-3xl">{t('title')}</Heading>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/75">{t('intro')}</p>
      {!standalone && (
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink/60">{t('listIntro')}</p>
      )}

      {visual}

      <ul className="product-list" data-products-list aria-label={t('listLabel')}>
        {items.map(renderCard)}
      </ul>

      {!standalone && (
        <p className="mt-8">
          <a className="products-all-link" data-products-all href={productHref(lang)}>
            {t('viewAll')}
          </a>
        </p>
      )}
    </section>
  );
}
