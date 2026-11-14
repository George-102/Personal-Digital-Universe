import type { JourneyCategory, JourneyEntry, LocaleText } from '../content/types.ts';

/** 与 content/types.ts 的 JourneyCategory 保持一致；用于校验与 messages 键生成 */
export const JOURNEY_CATEGORIES = [
  'education',
  'research',
  'opensource',
  'product',
  'competition',
  'work',
  'writing',
] as const satisfies readonly JourneyCategory[];

const LOOSE_DATE = /^(\d{4})(?:-(\d{2}))?$/;
/** 站内路径：单斜杠开头，不允许 // 协议相对写法 */
const INTERNAL_LINK = /^\/(?!\/)[A-Za-z0-9\-._~%!$&'()*+,;=:@/]*$/;
/** 外链：只允许 https，避免混合内容与 javascript: 注入 */
const EXTERNAL_LINK = /^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?::\d+)?(?:\/[^\s]*)?$/;

/**
 * 归一化为 `YYYY-MM`；只有年份时补 `-00`（同一年内排在有月份的条目之后）。
 * 非法（月份越界、格式不符）返回 null。
 */
export function normalizeJourneyDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = LOOSE_DATE.exec(value);
  if (!match) return null;
  const month = match[2];
  if (month !== undefined) {
    const numeric = Number(month);
    if (numeric < 1 || numeric > 12) return null;
    return `${match[1]}-${month}`;
  }
  return `${match[1]}-00`;
}

export type JourneyPeriod = { start: string; end: string | null };

/** 返回起止点；组件负责把 end === null 渲染成「至今」等本地化文案 */
export function journeyPeriod(entry: Pick<JourneyEntry, 'date' | 'endDate'>): JourneyPeriod {
  return { start: entry.date, end: entry.endDate ?? null };
}

/** 按时间倒序（最新在前）返回新数组，不修改入参 */
export function sortJourney<T extends { date: string }>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => {
    const left = normalizeJourneyDate(a.date) ?? '';
    const right = normalizeJourneyDate(b.date) ?? '';
    return right.localeCompare(left);
  });
}

/** 分类标签的 messages 键后缀：education → categories.education */
export function journeyCategoryMessageKey(category: JourneyCategory): string {
  return `categories.${category}`;
}

export function isValidJourneyLink(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  return INTERNAL_LINK.test(value) || EXTERNAL_LINK.test(value);
}

function isLocaleText(value: unknown): value is LocaleText {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.zh === 'string' &&
    record.zh.trim().length > 0 &&
    typeof record.en === 'string' &&
    record.en.trim().length > 0
  );
}

function isJourneyCategory(value: unknown): value is JourneyCategory {
  return typeof value === 'string' && (JOURNEY_CATEGORIES as readonly string[]).includes(value);
}

/** 单条经历的字段级校验（整表规则见 validateJourneyEntries） */
export function validateJourneyEntry(entry: unknown): string[] {
  const errors: string[] = [];
  if (entry === null || typeof entry !== 'object') return ['journey: 条目必须是对象'];
  const record = entry as Record<string, unknown>;

  const start = normalizeJourneyDate(record.date);
  if (!start) errors.push(`journey: date 非法或缺失 "${String(record.date)}"`);

  if (record.endDate !== undefined && record.endDate !== null && record.endDate !== '') {
    const end = normalizeJourneyDate(record.endDate);
    if (!end) {
      errors.push(`journey: endDate 非法 "${String(record.endDate)}"`);
    } else if (start && end < start) {
      errors.push(`journey: endDate 不能早于 date（${String(record.endDate)} < ${String(record.date)}）`);
    }
  }

  if (!isLocaleText(record.title)) errors.push('journey: title 必须是含 zh/en 的双语字段');
  if (!isLocaleText(record.summary)) errors.push('journey: summary 必须是含 zh/en 的双语字段');

  if (!isJourneyCategory(record.category)) {
    errors.push(`journey: category 非法值 "${String(record.category)}"，允许: ${JOURNEY_CATEGORIES.join(' | ')}`);
  }

  if (typeof record.public !== 'boolean') errors.push('journey: public 必须是布尔值');

  // detail 可选；一旦配置必须是非空的双语数组
  if (record.detail !== undefined && record.detail !== null) {
    const detail = record.detail;
    if (!Array.isArray(detail) || detail.length === 0 || !detail.every(isLocaleText)) {
      errors.push('journey: detail 必须是非空的含 zh/en 双语数组');
    }
  }

  // link 可选；一旦配置只允许站内路径或 https 外链
  if (record.link !== undefined && record.link !== null && record.link !== '') {
    if (!isValidJourneyLink(record.link)) {
      errors.push(`journey: link 只允许站内路径或 https 外链，非法值 "${String(record.link)}"`);
    }
  }

  return errors;
}

/**
 * 整表校验：逐条字段 + date/title 组合唯一 + 至少一条公开条目。
 * 供 prebuild 与 content/index.ts 调用，构建期拒绝坏数据。
 */export function validateJourneyEntries(entries: unknown): string[] {
  if (!Array.isArray(entries)) return ['journey: 必须是数组'];
  if (entries.length === 0) return [];

  const errors: string[] = [];
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    const prefix = `journey[${index}]`;
    const entryErrors = validateJourneyEntry(entry);
    errors.push(...entryErrors.map((message) => `${prefix}: ${message.replace(/^journey:\s*/, '')}`));

    if (entry !== null && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      const title = record.title as LocaleText | undefined;
      if (typeof record.date === 'string' && title && typeof title.zh === 'string') {
        const key = `${record.date}|${title.zh}|${title.en ?? ''}`;
        if (seen.has(key)) errors.push(`${prefix}: 重复的 date + title 组合（${key}）`);
        seen.add(key);
      }
    }
  });

  if (!entries.some((entry) => entry !== null && typeof entry === 'object' && (entry as { public?: unknown }).public === true)) {
    errors.push('journey: 至少需要一条 public: true 的条目，否则时间线为空');
  }

  return errors;
}

/** 时间显示：有结束时间时用 en dash 连接，否则只显示开始时间 */
export function formatJourneyPeriod(start: string, end?: string | null): string {
  return end ? `${start} — ${end}` : start;
}

export type JourneyItemView = {
  /** DOM 锚点/aria-controls 用，含语言与序号，跨语言唯一 */
  id: string;
  date: string;
  endDate: string | null;
  period: string;
  title: string;
  summary: string;
  /** 空数组表示该条没有更多详情（UI 不渲染展开控件） */
  detail: string[];
  category: JourneyCategory;
  categoryMessageKey: string;
  link: string | null;
};

/**
 * 把 content/ 的双语数据解成当前语言的纯字符串视图。
 * 服务端组件调用，客户端组件只消费字符串，不接触 i18n 运行时。
 */
export function buildJourneyItems(
  entries: readonly JourneyEntry[],
  lang: 'zh' | 'en',
): JourneyItemView[] {
  return entries.map((entry, index) => ({
    id: `${lang}-${entry.date}-${String(index + 1).padStart(2, '0')}`,
    date: entry.date,
    endDate: entry.endDate ?? null,
    period: formatJourneyPeriod(entry.date, entry.endDate),
    title: entry.title[lang],
    summary: entry.summary[lang],
    detail: (entry.detail ?? []).map((paragraph) => paragraph[lang]),
    category: entry.category,
    categoryMessageKey: journeyCategoryMessageKey(entry.category),
    link: entry.link ?? null,
  }));
}
