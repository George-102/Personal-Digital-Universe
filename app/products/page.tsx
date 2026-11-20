import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ProductsSection from '@/components/ProductsSection';
import ProductsInteractions from '@/components/ProductsInteractions';
import { products } from '@/content/index';
import ProductsVisual from '@/components/ProductsVisual';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { SITE_URL } from '@/lib/site';
// 全量卡与 3D 视觉层样式按路由加载（不进首页全局表，TBT 红线）
import '@/components/products-page.css';

/** US-013d：中文 Products 列表路由（与 /projects 同构：页面自带 html/body）。 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'zh', namespace: 'Products' });
  return {
    title: t('routeTitle'),
    description: t('routeDescription'),
    openGraph: {
      title: t('routeTitle'),
      description: t('routeDescription'),
      type: 'website',
    },
    alternates: { canonical: `${SITE_URL}/products/` },
  };
}

export default async function ProductsPage() {
  const t = await getTranslations({ locale: 'zh', namespace: 'Home' });

  return (
    <html lang="zh">
      <body>
        <SiteNav lang="zh" />
        <main>
          <ProductsInteractions count={products.length}>
            <ProductsSection lang="zh" standalone visual={<ProductsVisual lang="zh" />} />
          </ProductsInteractions>
        </main>
        <SiteFooter
          lang="zh"
          languageName={t('languageName')}
          languageHref="/en/products/"
        />
      </body>
    </html>
  );
}
