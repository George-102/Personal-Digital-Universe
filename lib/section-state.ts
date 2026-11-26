import { navItems, navTargetId, type NavItem } from './nav.ts';

export type SectionVisual = {
  id: string;
  /** 细线 / 模块标识主色 */
  accent: string;
  /** 3D 场景主光色 */
  glow: string;
  /** 粒子 / 节点色 */
  particle: string;
  labelKey: string;
};

/** 调色板只按 nav 模块 id 索引；注册表仍是模块清单的单一来源。 */
const palette: Record<string, { accent: string; glow: string; particle: string }> = {
  home: { accent: '#22d3ee', glow: '#7c6cff', particle: '#8f9bff' },
  about: { accent: '#a78bfa', glow: '#8b5cf6', particle: '#c4b5fd' },
  skills: { accent: '#c084fc', glow: '#a855f7', particle: '#d8b4fe' },
  journey: { accent: '#38bdf8', glow: '#0ea5e9', particle: '#7dd3fc' },
  research: { accent: '#60a5fa', glow: '#3b82f6', particle: '#93c5fd' },
  projects: { accent: '#34d399', glow: '#10b981', particle: '#6ee7b7' },
  products: { accent: '#fbbf24', glow: '#f59e0b', particle: '#fcd34d' },
  writing: { accent: '#f472b6', glow: '#ec4899', particle: '#f9a8d4' },
  contact: { accent: '#2dd4bf', glow: '#14b8a6', particle: '#5eead4' },
};

const fallback = palette.home;

export const sectionVisuals: readonly SectionVisual[] = navItems.map((item) => ({
  id: item.id,
  ...(palette[item.id] ?? fallback),
  labelKey: item.labelKey,
}));

export function sectionVisualFor(id: string | null | undefined): SectionVisual {
  return sectionVisuals.find((item) => item.id === id) ?? sectionVisuals[0];
}

export function sectionTintFor(id: string | null | undefined): string {
  return sectionVisualFor(id).particle;
}

export type SectionPosition = { id: string; top: number };

/**
 * 当前模块判定与 US-004 导航激活态一致：以视口 40% 线为准，
 * 到达页面底部时取最后一个模块。只读缓存位置，不做任何布局读取。
 */
export function activeSectionAt(
  sections: readonly SectionPosition[],
  scrollY: number,
  viewportHeight: number,
  maxScroll: number,
): string {
  const first = sections[0]?.id ?? 'home';
  if (sections.length === 0) return first;
  if (maxScroll > 0 && scrollY > 0 && scrollY >= maxScroll - 2) {
    return sections[sections.length - 1].id;
  }
  const line = scrollY + viewportHeight * 0.4;
  let active = first;
  for (const section of sections) {
    if (section.top <= line) active = section.id;
  }
  return active;
}

/** 独立路由没有锚点 section 时，用路径回退到对应模块。 */
export function sectionFromPathname(pathname: string): string {
  const path = pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  for (const item of navItems) {
    const id = navTargetId(item) ?? item.id;
    if (path === `/${id}` || path.startsWith(`/${id}/`)) return id;
  }
  return 'home';
}

const HEX = /^#[0-9a-f]{6}$/i;

/** 返回错误信息数组，空数组表示通过；prebuild 调用后构建期拒绝非法配置。 */
export function validateSectionVisuals(
  visuals: readonly unknown[],
  items: readonly NavItem[] = navItems,
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(visuals) || visuals.length === 0) return ['sectionVisuals: 注册表不能为空'];

  const seen = new Set<string>();
  visuals.forEach((raw, index) => {
    const prefix = `sectionVisuals[${index}]`;
    if (raw === null || typeof raw !== 'object') {
      errors.push(`${prefix}: 必须是对象`);
      return;
    }
    const item = raw as Partial<SectionVisual>;
    if (typeof item.id !== 'string' || !item.id.trim()) {
      errors.push(`${prefix}.id: 缺失`);
    } else if (seen.has(item.id)) {
      errors.push(`${prefix}.id: 重复 ${item.id}`);
    } else {
      seen.add(item.id);
    }
    for (const key of ['accent', 'glow', 'particle'] as const) {
      const value = item[key];
      if (typeof value !== 'string' || !HEX.test(value)) {
        errors.push(`${prefix}.${key}: 非法颜色 ${String(value)}`);
      }
    }
  });

  for (const item of items) {
    if (!seen.has(item.id)) errors.push(`sectionVisuals: 缺失 ${item.id} 的视觉配置`);
  }
  for (const id of seen) {
    if (!items.some((item) => item.id === id)) errors.push(`sectionVisuals: 多余模块 ${id}`);
  }
  return errors;
}
