export type NavLang = 'zh' | 'en';

/**
 * 全局导航条目。导航栏只消费这份配置，
 * 后续模块（Journey / Research / Projects …）落地后在这里逐条加入即可。
 * 决策 A：只收录真实存在的模块，不建空占位 section。
 */
export type NavItem = {
  id: string;
  /** messages 中的文案键，如 Nav.home */
  labelKey: string;
  /** 站内目标：根路径 / 或页面内锚点 #xxx */
  href: string;
  /** 排序，升序且唯一 */
  order: number;
};

export const navItems: readonly NavItem[] = [
  { id: 'home', labelKey: 'Nav.home', href: '#home', order: 10 },
  { id: 'about', labelKey: 'Nav.about', href: '#about', order: 20 },
];

export function sortNavItems(items: readonly NavItem[]): NavItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function findNavItem(
  items: readonly NavItem[],
  id: string | null | undefined,
): NavItem | undefined {
  if (!id) return undefined;
  return items.find((item) => item.id === id);
}

const ANCHOR_HREF = /^#([A-Za-z][A-Za-z0-9_-]*)$/;

/** 提取锚点 id：#about → about；非锚点目标返回 null */
export function navTargetId(item: Pick<NavItem, 'href'>): string | null {
  const match = ANCHOR_HREF.exec(item.href);
  return match ? match[1] : null;
}

/** 按当前语言解析实际 href（英文页加 /en/ 前缀） */
export function resolveNavHref(item: Pick<NavItem, 'href'>, lang: NavLang): string {
  const base = lang === 'en' ? '/en/' : '/';
  return item.href === '/' ? base : `${base}${item.href}`;
}

/** messages 命名空间内的短键：Nav.home → home */
export function navMessageKey(item: Pick<NavItem, 'labelKey'>): string {
  const index = item.labelKey.indexOf('.');
  return index === -1 ? item.labelKey : item.labelKey.slice(index + 1);
}

const LABEL_KEY = /^[A-Za-z][A-Za-z0-9]*\.[A-Za-z0-9_]+$/;

/** 返回错误信息数组，空数组表示通过。prebuild 调用后在构建期拒绝非法配置。 */
export function validateNavItems(items: readonly unknown[]): string[] {
  const errors: string[] = [];
  if (!Array.isArray(items) || items.length === 0) {
    return ['nav: 注册表不能为空'];
  }
  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();

  items.forEach((raw, index) => {
    const prefix = `nav[${index}]`;
    if (raw === null || typeof raw !== 'object') {
      errors.push(`${prefix}: 必须是对象`);
      return;
    }
    const item = raw as Partial<NavItem>;

    if (typeof item.id !== 'string' || !item.id.trim()) {
      errors.push(`${prefix}.id: 缺失`);
    } else if (seenIds.has(item.id)) {
      errors.push(`${prefix}.id: 重复 ${item.id}`);
    } else {
      seenIds.add(item.id);
    }

    if (typeof item.labelKey !== 'string' || !LABEL_KEY.test(item.labelKey)) {
      errors.push(`${prefix}.labelKey: 缺失或格式非法`);
    }

    if (
      typeof item.href !== 'string' ||
      (item.href !== '/' && !ANCHOR_HREF.test(item.href))
    ) {
      errors.push(`${prefix}.href: 非法值 ${String(item.href)}`);
    }

    if (typeof item.order !== 'number' || !Number.isFinite(item.order) || item.order < 0) {
      errors.push(`${prefix}.order: 非法值 ${String(item.order)}`);
    } else if (seenOrders.has(item.order)) {
      errors.push(`${prefix}.order: 重复 ${item.order}`);
    } else {
      seenOrders.add(item.order);
    }
  });

  return errors;
}
