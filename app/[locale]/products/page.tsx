import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ProductsSection from '@/components/ProductsSection';
import ProductsInteractions from '@/components/ProductsInteractions';
import { products } from '@/content/index';
import ProductsVisual from '@/components/ProductsVisual';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
// 全量卡与 3D 视觉层样式按路由加载（不进首页全局表，TBT 红线）
import '@/components/products-page.css';

/** US-013d：英文 Products 列表路由（[locale]/layout.tsx 已预生成 en）。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Products' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/en/products/` },
  };
}

export default async function LocaleProductsPage({
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
        <ProductsInteractions count={products.length}>
          <ProductsSection lang={lang} standalone visual={<ProductsVisual lang={lang} />} />
        </ProductsInteractions>
      </main>
      <SiteFooter
        lang={lang}
        languageName={t('languageName')}
        languageHref={locale === 'zh' ? '/en/products/' : '/products/'}
      />
    </>
  );
}
