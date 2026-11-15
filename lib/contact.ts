import type { ContactLink, LocaleText } from '../content/types.ts';

/** PRD US-018 详述 2：公开联系方式的类别白名单 */
export const CONTACT_KINDS = ['github', 'blog', 'social', 'other'] as const;

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const INTERNAL_PATH = /^\/[A-Za-z0-9_\-./?#%]*$/;
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_PATTERN.test(value);
}

/** 只允许 https 外链与站内安全路径；拒绝 javascript: / data: / http: / 协议相对 URL / 目录穿越 */
export function isValidContactUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value === '') return false;
  if (value.startsWith('/')) {
    return (
      !value.startsWith('//') &&
      INTERNAL_PATH.test(value) &&
      !value.includes('..') &&
      !value.includes('\\')
    );
  }
  if (!/^https:\/\/[A-Za-z0-9]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isLocaleText(value: unknown): value is LocaleText {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.zh === 'string' &&
    record.zh.length > 0 &&
    typeof record.en === 'string' &&
    record.en.length > 0
  );
}

/** 返回错误信息数组，空数组表示通过。prebuild 与单测共用。 */
export function validateContactLinks(links: readonly unknown[]): string[] {
  const errors: string[] = [];
  if (!Array.isArray(links)) return ['links: 必须是数组'];
  const seen = new Set<string>();

  links.forEach((raw, index) => {
    const prefix = `links[${index}]`;
    if (!raw || typeof raw !== 'object') {
      errors.push(`${prefix}: 必须是对象`);
      return;
    }
    const item = raw as Partial<ContactLink>;
    if (typeof item.id !== 'string' || !ID_PATTERN.test(item.id)) {
      errors.push(`${prefix}.id: 缺失或格式非法`);
    } else if (seen.has(item.id)) {
      errors.push(`${prefix}.id: 重复 ${item.id}`);
    } else {
      seen.add(item.id);
    }
    if (
      typeof item.kind !== 'string' ||
      !(CONTACT_KINDS as readonly string[]).includes(item.kind)
    ) {
      errors.push(`${prefix}.kind: 非法值 ${String(item.kind)}`);
    }
    if (!isLocaleText(item.label)) {
      errors.push(`${prefix}.label: 必须是含非空 zh/en 的双语字段`);
    }
    if (!isValidContactUrl(item.url)) {
      errors.push(`${prefix}.url: 非法值 ${String(item.url)}`);
    }
    if (typeof item.public !== 'boolean') {
      errors.push(`${prefix}.public: 必须是布尔值`);
    }
  });

  return errors;
}

/** Contact 顶层校验：email / links / collaborations 都可缺省，但一旦配置必须合法。 */
export function validateContact(content: unknown): string[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return ['contact: 必须是对象'];
  }
  const record = content as Record<string, unknown>;
  const errors: string[] = [];

  if (
    record.email !== undefined &&
    record.email !== null &&
    record.email !== '' &&
    !isValidEmail(record.email)
  ) {
    errors.push(`email: 非法值 ${String(record.email)}`);
  }
  if (record.links !== undefined) {
    errors.push(...validateContactLinks(record.links as unknown[]));
  }
  if (record.collaborations !== undefined) {
    const list = record.collaborations;
    if (!Array.isArray(list) || list.length === 0 || !list.every(isLocaleText)) {
      errors.push('collaborations: 必须是非空且每项含 zh/en 的双语数组');
    }
  }
  return errors;
}

export function publicContactLinks<T extends { public: boolean }>(links: readonly T[]): T[] {
  return links.filter((item) => item.public);
}

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}
