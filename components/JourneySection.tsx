import { getTranslations } from 'next-intl/server';
import { journey } from '@/content/index';
import { buildJourneyItems } from '@/lib/journey';
import JourneyExperience from '@/components/JourneyExperience';

/**
 * US-008c：成长时间线。数据来自 content/journey.ts，服务端渲染成静态 HTML，
 * 3D 轨道（US-008d）只是视觉层，不进入这条信息链。
 */
export default async function JourneySection({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Journey' });
  const items = buildJourneyItems(journey, lang);

  // 没有可公开条目时不渲染空 section（避免空标题与空列表）
  if (items.length === 0) return null;

  return (
    <section
      id="journey"
      data-journey-section
      className="mx-auto w-full max-w-4xl scroll-mt-24 px-6 py-24"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{t('title')}</h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/75">{t('intro')}</p>

      <JourneyExperience
        items={items}
        labels={{
          listLabel: t('listLabel'),
          expand: t('expand'),
          collapse: t('collapse'),
          noDetail: t('noDetail'),
          linkLabel: t('linkLabel'),
          categories: {
            education: t('categories.education'),
            research: t('categories.research'),
            opensource: t('categories.opensource'),
            product: t('categories.product'),
            competition: t('categories.competition'),
            work: t('categories.work'),
            writing: t('categories.writing'),
          },
        }}
      />
    </section>
  );
}
