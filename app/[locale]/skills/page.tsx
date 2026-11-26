import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import SkillsSection from '@/components/SkillsSection';
import SkillsInteractions from '@/components/SkillsInteractions';
import { skills } from '@/content/index';
import SkillsVisual from '@/components/SkillsVisual';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
import '@/components/skills-page.css';

/** US-007d：英文 Skills 列表路由（[locale]/layout.tsx 已预生成 en）。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Skills' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/en/skills/` },
  };
}

export default async function LocaleSkillsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale === 'zh' ? 'zh' : 'en';
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <>
      <SiteNav lang={lang} />
      <main>
        <SkillsInteractions count={skills.length}>
          <SkillsSection lang={lang} standalone visual={<SkillsVisual lang={lang} />} />
        </SkillsInteractions>
      </main>
      <SiteFooter
        lang={lang}
        languageName={t('languageName')}
        languageHref={locale === 'zh' ? '/en/skills/' : '/skills/'}
      />
    </>
  );
}
