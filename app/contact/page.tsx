import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ContactSection from '@/components/ContactSection';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';

/** US-018j：中文 Contact 独立路由。根布局只返回 children，页面自带 html/body（与 app/page.tsx 同构）。 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'zh', namespace: 'Contact' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/contact/` },
  };
}

export default async function ContactPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <ContactSection lang="zh" standalone />
        </main>
        <SiteFooter
          lang="zh"
          languageName={t('languageName')}
          languageHref="/en/contact/"
        />
      </body>
    </html>
  );
}
