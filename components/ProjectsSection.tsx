import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { projects } from '@/content/index';
import { PROJECT_CATEGORIES, projectHref } from '@/lib/projects';
import type { ProjectCategory, ProjectStatus } from '@/content/types';

type Props = {
  lang: 'zh' | 'en';
  /** 独立 /projects 列表页用 h1；首页 section 用 h2 */
  standalone?: boolean;
  /** 首页精简模式：只展示 featured 精选，方法/详情留到列表页（US-010k TBT 教训） */
  compact?: boolean;
  /** 3D 悬浮卡片视觉层（仅列表页传入；首页不引入客户端 3D 模块） */
  visual?: ReactNode;
};

const STATUS_KEY: Record<ProjectStatus, string> = {
  active: 'statusActive',
  maintained: 'statusMaintained',
  archived: 'statusArchived',
  completed: 'statusCompleted',
};

/**
 * US-012d：GitHub 开源项目。数据来自 content/index.ts（已合并构建期缓存），
 * 服务端渲染成静态 HTML：无 JS / 无 WebGL 时名称、简介、状态与 GitHub 入口全部可读。
 * 3D 层（US-012g）是 aria-hidden 概念视觉，不承载信息。
 */
export default async function ProjectsSection({
  lang,
  standalone = false,
  compact = false,
  visual,
}: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Projects' });
  // US-010k 红线：首页只放 2 张精选卡，全量 9 张与真实封面留在 /projects 列表页
  const items = compact ? projects.filter((item) => item.featured).slice(0, 2) : projects;
  if (items.length === 0) return null;

  const Heading = standalone ? 'h1' : 'h2';
  const groups = PROJECT_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  const renderCard = (item: (typeof projects)[number]) => {
    // 首页 compact 卡：仅 name + 简介两行（US-012j TBT 回归教训——cover 占位/状态/精选/star/
    // 分类 chip 与渐变 paint 都进首屏 styleLayout，全量信息留在 /projects 列表页）。
    if (compact) {
      return (
        <li
          key={item.slug}
          className="project-card"
          data-project-item
          data-project-slug={item.slug}
          data-project-category={item.category}
          data-project-status={item.status}
          data-project-private={item.repoPrivate ? 'true' : 'false'}
          data-project-featured={item.featured ? 'true' : 'false'}
        >
          <h3 className="project-name" data-project-name>
            {item.name}
          </h3>
          <p className="project-description" data-project-description>
            {item.description[lang]}
          </p>
        </li>
      );
    }

    const cover = item.image ?? `https://opengraph.githubassets.com/1/${item.repo}`;
    return (
      <li
        key={item.slug}
        className="project-card"
        data-project-item
        data-project-slug={item.slug}
        data-project-category={item.category}
        data-project-status={item.status}
        data-project-private={item.repoPrivate ? 'true' : 'false'}
        data-project-featured={item.featured ? 'true' : 'false'}
      >
        <div
          className="project-cover"
          data-project-image
          aria-hidden="true"
          // US-010k 红线：首页 compact 不发外部 OG 图片请求（4 张卡），只用 CSS 渐变占位；
          // 真实封面只在 /projects 列表页加载。
          style={compact || item.repoPrivate ? undefined : { backgroundImage: `url("${cover}")` }}
        />
        <div className="project-card-head">
          <h3 className="project-name" data-project-name>
            {item.name}
          </h3>
          <span className="project-status" data-project-status={item.status}>
            {t(STATUS_KEY[item.status])}
          </span>
        </div>
        <p className="project-meta">
          <span className="project-category" data-project-category-label>
            {t(`categories.${item.category}`)}
          </span>
          {item.featured && (
            <span className="project-featured" data-project-featured-label>
              {t('featuredLabel')}
            </span>
          )}
          <span className="project-stars" data-project-stars>
            ★ {item.stars ?? 0}
          </span>
        </p>
        <p className="project-description" data-project-description>
          {item.description[lang]}
        </p>

        {!compact && (
          <>
            <ul className="project-stack" data-project-stack aria-label={t('stackLabel')}>
              {item.stack.map((tech) => (
                <li key={tech} className="project-chip">
                  {tech}
                </li>
              ))}
            </ul>

            <details className="project-details" data-project-details>
              <summary className="project-summary" data-project-expand>
                <span className="project-toggle-hint project-hint-expand">{t('expand')}</span>
                <span className="project-toggle-hint project-hint-collapse">{t('collapse')}</span>
              </summary>
              <div className="project-panel" data-project-detail>
                <p className="project-panel-label">{t('detailLabel')}</p>
                {item.detail ? (
                  <p>{item.detail[lang]}</p>
                ) : (
                  <p>{item.description[lang]}</p>
                )}
                {item.repoPrivate ? (
                  <span className="project-private" data-project-private-note>
                    {t('privateLabel')}
                  </span>
                ) : (
                  <a
                    className="project-github"
                    data-project-github
                    href={`https://github.com/${item.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('githubLabel')}
                  </a>
                )}
              </div>
            </details>
          </>
        )}
      </li>
    );
  };

  return (
    <section
      id="projects"
      data-projects-section
      className="projects-section mx-auto w-full max-w-5xl scroll-mt-24 px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <Heading className="mt-3 text-2xl font-semibold sm:text-3xl">{t('title')}</Heading>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/75">{t('intro')}</p>
      {!standalone && (
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink/60">{t('listIntro')}</p>
      )}

      {visual}

      {compact ? (
        <ul className="project-list" data-projects-list aria-label={t('listLabel')}>
          {items.map(renderCard)}
        </ul>
      ) : (
        groups.map(({ category, items: groupItems }) => (
          <section key={category} className="project-group" data-projects-group data-category={category}>
            <h2 className="project-group-title">{t(`categories.${category}` as `categories.${ProjectCategory}`)}</h2>
            <ul className="project-list" data-projects-list aria-label={t('listLabel')}>
              {groupItems.map(renderCard)}
            </ul>
          </section>
        ))
      )}

      {!standalone && (
        <p className="mt-8">
          <a className="projects-all-link" data-projects-all href={projectHref(lang)}>
            {t('viewAll')}
          </a>
        </p>
      )}
    </section>
  );
}
