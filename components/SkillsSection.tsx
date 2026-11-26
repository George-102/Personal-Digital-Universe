import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { skills } from '@/content/index';
import { SKILL_CATEGORIES, skillCategoryKey, skillHref } from '@/lib/skills';
import type { Skill, SkillCategory } from '@/content/types';

type Props = {
  lang: 'zh' | 'en';
  /** 独立 /skills 列表页用 h1；首页 section 用 h2 */
  standalone?: boolean;
  /** 首页精简模式：每领域仅一条精选技能，只含名称与简介（TBT 红线） */
  compact?: boolean;
  /** 3D 技能星图视觉层（仅列表页传入；首页不引入客户端 3D 模块） */
  visual?: ReactNode;
};

/**
 * US-007c：技术能力。数据来自 content/index.ts（已过滤 public），
 * 服务端渲染成静态 HTML：无 JS / 无 WebGL 时领域、名称、说明与关联链接全部可读。
 * 3D 星图（US-007f）是 aria-hidden 概念视觉层，不承载信息。
 * 不展示熟练度百分比——类型层与构建期校验双重保证。
 */
export default async function SkillsSection({
  lang,
  standalone = false,
  compact = false,
  visual,
}: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Skills' });
  const groups = SKILL_CATEGORIES.map((category) => ({
    category,
    items: skills.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
  if (groups.length === 0) return null;

  const Heading = standalone ? 'h1' : 'h2';
  const GroupHeading = standalone || !compact ? 'h2' : 'h3';
  const SkillName = compact ? 'h4' : 'h3';

  const renderItem = (item: Skill) => {
    if (compact) {
      return (
        <li
          key={item.slug}
          className="skill-card"
          data-skill-item
          data-skill-slug={item.slug}
          data-skill-category={skillCategoryKey(item.category)}
          data-skill-featured={item.featured ? 'true' : 'false'}
        >
          <SkillName className="skill-name" data-skill-name>
            {item.name}
          </SkillName>
          <p className="skill-description" data-skill-description>
            {item.description[lang]}
          </p>
        </li>
      );
    }

    return (
      <li
        key={item.slug}
        className="skill-card"
        data-skill-item
        data-skill-slug={item.slug}
        data-skill-category={skillCategoryKey(item.category)}
        data-skill-featured={item.featured ? 'true' : 'false'}
      >
        <div className="skill-card-head">
          <SkillName className="skill-name" data-skill-name>
            {item.name}
          </SkillName>
          {item.featured && (
            <span className="skill-featured" data-skill-featured-label>
              {t('featuredLabel')}
            </span>
          )}
        </div>
        <p className="skill-description" data-skill-description>
          {item.description[lang]}
        </p>
        <ul className="skill-tags" data-skill-tags aria-label={t('tagsLabel')}>
          {item.tags.map((tag) => (
            <li key={tag} className="skill-tag">
              {tag}
            </li>
          ))}
        </ul>
        <details className="skill-details" data-skill-details>
          <summary className="skill-summary" data-skill-expand>
            <span className="skill-toggle-hint skill-hint-expand">{t('expand')}</span>
            <span className="skill-toggle-hint skill-hint-collapse">{t('collapse')}</span>
          </summary>
          <div className="skill-panel" data-skill-detail>
            <p className="skill-panel-label">{t('detailLabel')}</p>
            <p>{item.detail[lang]}</p>
            <p className="skill-panel-links" data-skill-related>
              {item.related?.map((related) => (
                <a
                  key={related.href}
                  className="skill-related-link"
                  data-skill-related-link
                  href={related.href}
                >
                  {related.label[lang]}
                </a>
              ))}
              {!item.related?.length && (
                <span className="skill-no-related" data-skill-no-related>
                  {t('noRelated')}
                </span>
              )}
            </p>
          </div>
        </details>
      </li>
    );
  };

  return (
    <section
      id="skills"
      data-skills-section
      className="skills-section mx-auto w-full max-w-5xl scroll-mt-24 px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <Heading className="mt-3 text-2xl font-semibold sm:text-3xl">{t('title')}</Heading>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/75">{t('intro')}</p>
      {!standalone && (
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink/60">{t('listIntro')}</p>
      )}

      {visual}

      <div className="skill-groups" data-skills-groups>
        {groups.map(({ category, items }) => {
          const featured = items.filter((item) => item.featured);
          const shown = compact ? (featured.length > 0 ? featured.slice(0, 1) : items.slice(0, 1)) : items;
          return (
            <div
              key={category}
              className="skill-group"
              data-skill-group
              data-skill-category={skillCategoryKey(category)}
            >
              <GroupHeading className="skill-group-title">
                {t(`categories.${category}` as `categories.${SkillCategory}`)}
              </GroupHeading>
              <ul className="skill-list" data-skills-list aria-label={t('listLabel')}>
                {shown.map(renderItem)}
              </ul>
            </div>
          );
        })}
      </div>

      {!standalone && (
        <p className="mt-8">
          <a className="skills-all-link" data-skills-all href={skillHref(lang)}>
            {t('viewAll')}
          </a>
        </p>
      )}
    </section>
  );
}
