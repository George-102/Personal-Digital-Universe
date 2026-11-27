import { getTranslations } from 'next-intl/server';
import { education } from '@/content/index';
import { educationStatusMessageKey } from '@/lib/education';
import type { EducationEntry, LocaleText } from '@/content/types';

type Props = { lang: 'zh' | 'en' };

/**
 * US-009：教育背景。数据来自 content/index.ts（已过滤 public），
 * 服务端渲染成静态 HTML：无 JS / 无 WebGL 时全部文字可读。
 * 纯时间轴，无 3D；可选字段缺省时不渲染任何空标签（AC2）。
 */
export default async function EducationSection({ lang }: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Education' });
  if (education.length === 0) return null;

  const renderLocale = (label: string, value: LocaleText | undefined, key: string) => {
    if (!value) return null;
    return (
      <p className="education-field" data-education-field={key}>
        <span className="education-field-label">{label}</span>
        <span>{value[lang]}</span>
      </p>
    );
  };

  const renderList = (label: string, values: LocaleText[] | undefined, key: string) => {
    if (!values || values.length === 0) return null;
    return (
      <div className="education-field" data-education-field={key}>
        <p className="education-field-label">{label}</p>
        <ul className="education-inline-list">
          {values.map((item, index) => (
            <li key={`${key}-${index}`}>{item[lang]}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderItem = (item: EducationEntry) => {
    const statusKey = educationStatusMessageKey(item.status);
    const period = `${item.startDate}${item.endDate ? ` — ${item.endDate}` : ` — ${t('present')}`}`;
    return (
      <li
        key={item.slug}
        className="education-item"
        data-education-item
        data-education-slug={item.slug}
        data-education-status={item.status}
        data-education-degree-level={item.degreeLevel}
      >
        <div className="education-item-head">
          <h3 className="education-degree" data-education-degree>
            {item.degree[lang]}
          </h3>
          <span className="education-status" data-education-status-label>
            {t(statusKey as 'statuses.InProgress')}
          </span>
        </div>
        <p className="education-period" data-education-period>
          {period}
        </p>
        <div className="education-fields" data-education-fields>
          {renderLocale(t('schoolLabel'), item.school, 'school')}
          {renderLocale(t('collegeLabel'), item.college, 'college')}
          {renderLocale(t('majorLabel'), item.major, 'major')}
          {item.statusNote && (
            <p className="education-status-note" data-education-field="status-note">
              {item.statusNote[lang]}
            </p>
          )}
          {renderList(t('coursesLabel'), item.courses, 'courses')}
          {renderList(t('experiencesLabel'), item.experiences, 'experiences')}
          {renderList(t('interestsLabel'), item.interests, 'interests')}
          {renderList(t('detailLabel'), item.detail, 'detail')}
        </div>
      </li>
    );
  };

  return (
    <section
      id="education"
      className="education-section mx-auto w-full max-w-5xl scroll-mt-24 px-6 py-24"
      data-education-section
      aria-labelledby="education-title"
    >
      <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
      <h2 id="education-title" className="mt-3 text-2xl font-semibold sm:text-3xl">
        {t('title')}
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink/75">{t('intro')}</p>
      <ol className="education-list" data-education-list aria-label={t('listLabel')}>
        {education.map(renderItem)}
      </ol>
    </section>
  );
}
