import { getTranslations } from 'next-intl/server';
import NavBar from '@/components/NavBar';
import { navItems, navMessageKey, resolveNavHref, sortNavItems, type NavLang } from '@/lib/nav';

/** 服务端壳：从注册表解析双语文案与本地化 href，把纯数据交给 NavBar。 */
export default async function SiteNav({ lang }: { lang: NavLang }) {
  const tn = await getTranslations({ locale: lang, namespace: 'Nav' });
  const items = sortNavItems(navItems).map((item) => ({
    id: item.id,
    label: tn(navMessageKey(item)),
    href: resolveNavHref(item, lang),
  }));

  return (
    <NavBar
      items={items}
      labels={{ main: tn('mainLabel'), menu: tn('menu'), menuClose: tn('menuClose') }}
    />
  );
}
