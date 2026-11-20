import { getTranslations } from 'next-intl/server';
import ProductsCanvas from '@/components/ProductsCanvas';
import { products } from '@/content/index';

/**
 * US-013f：3D 产品展台概念视觉层。只由 /products 列表页引入，
 * 首页不加载客户端 3D 模块（US-010k TBT 教训）。
 * PRD 红线：概念性标注与 DOM 信息同在，3D 层 aria-hidden 纯装饰。
 */
export default async function ProductsVisual({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Products' });

  return (
    <div className="products-visual-row">
      <div className="products-visual" aria-hidden="true" data-products-visual>
        <ProductsCanvas count={products.length} />
      </div>
      <p className="products-concept-note" data-products-concept-note>
        {t('conceptNote')}
      </p>
    </div>
  );
}
