import type { AboutContent } from '../content/types.ts';

/** 站内静态资源路径白名单：禁止外链、相对路径、目录穿越与非预期扩展名 */
export const PORTRAIT_PATH = /^\/[A-Za-z0-9/_-]+\.(webp|png|jpe?g|avif|svg)$/;
export const CV_PATH = /^\/[A-Za-z0-9/_-]+\.pdf$/;

export type AboutLang = 'zh' | 'en';

export type ResolvedAbout = {
  bio: string[];
  highlights: string[];
  portrait: string | null;
  cvUrl: string | null;
};

const EMPTY: ResolvedAbout = { bio: [], highlights: [], portrait: null, cvUrl: null };

function localeValue(value: unknown, lang: AboutLang): string {
  if (value === null || typeof value !== 'object') return '';
  const text = (value as Record<string, unknown>)[lang];
  return typeof text === 'string' && text.length > 0 ? text : '';
}

function localeList(value: unknown, lang: AboutLang): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => localeValue(item, lang)).filter((text) => text.length > 0);
}

/**
 * 把 content/ 的双语 About 数据解析为当前语言的可渲染结构。
 * 任何非法/缺失字段都安全降级为空值，页面不会因数据问题崩溃。
 */
export function resolveAbout(
  about: AboutContent | null | undefined,
  lang: AboutLang,
): ResolvedAbout {
  if (about === null || typeof about !== 'object') return { ...EMPTY, bio: [], highlights: [] };
  const portrait = typeof about.portrait === 'string' && PORTRAIT_PATH.test(about.portrait)
    ? about.portrait
    : null;
  const cvUrl = typeof about.cvUrl === 'string' && CV_PATH.test(about.cvUrl)
    ? about.cvUrl
    : null;
  return {
    bio: localeList(about.bio, lang),
    highlights: localeList(about.highlights, lang),
    portrait,
    cvUrl,
  };
}

/** 只有配置了合法站内 PDF 才显示 Download CV 入口（PRD 验收 5） */
export function hasCv(about: AboutContent | null | undefined): boolean {
  return typeof about?.cvUrl === 'string' && CV_PATH.test(about.cvUrl);
}

/** 只有配置了合法站内图片才渲染照片（默认走 3D 抽象头像） */
export function hasPortrait(about: AboutContent | null | undefined): boolean {
  return typeof about?.portrait === 'string' && PORTRAIT_PATH.test(about.portrait);
}
