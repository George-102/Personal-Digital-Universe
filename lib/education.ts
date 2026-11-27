import type {
  EducationDegreeLevel,
  EducationEntry,
  EducationStatus,
  LocaleText,
} from '../content/types.ts';
import { normalizeJourneyDate } from './journey.ts';

/** PRD US-009：学历阶段严格三态，备考研究生只能是 In Progress / Planned */
export const EDUCATION_STATUSES = ['Completed', 'In Progress', 'Planned'] as const satisfies readonly EducationStatus[];

/** 区分本科与研究生：研究生未完成状态必须给出明确说明，已完成状态构建期拒绝 */
export const EDUCATION_DEGREE_LEVELS = ['undergraduate', 'graduate'] as const satisfies readonly EducationDegreeLevel[];

/**
 * 伪装「已获得研究生学历」的字段名在类型层不存在；
 * 构建期显式拒绝，即使有人用 as any 注入也被拦下（PRD §8.3）。
 */
export const FORBIDDEN_EDUCATION_FIELDS = [
  'graduated',
  'degreeObtained',
  'degreeAwarded',
  'awarded',
  'graduationCompleted',
  'completedAt',
  'masterCompleted',
  'phdCompleted',
] as const;

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isValidEducationSlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

/** 与 journey 共用日期归一化：YYYY → YYYY-00，YYYY-MM 原样 */
export function normalizeEducationDate(value: unknown): string | null {
  return normalizeJourneyDate(value);
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

function isStatus(value: unknown): value is EducationStatus {
  return typeof value === 'string' && (EDUCATION_STATUSES as readonly string[]).includes(value);
}

function isDegreeLevel(value: unknown): value is EducationDegreeLevel {
  return (
    typeof value === 'string' && (EDUCATION_DEGREE_LEVELS as readonly string[]).includes(value)
  );
}

/** 单条校验；返回错误信息数组，空数组表示通过。prebuild 与单测共用。 */
export function validateEducation(item: unknown): string[] {
  const errors: string[] = [];
  if (item === null || typeof item !== 'object') {
    return ['education: 条目必须是对象'];
  }
  const record = item as Partial<EducationEntry> & Record<string, unknown>;

  if (!isValidEducationSlug(record.slug)) {
    errors.push(`slug: 非法值 "${String(record.slug)}"（要求小写 kebab-case）`);
  }
  if (!isLocaleText(record.degree)) {
    errors.push('degree: 必须是含非空 zh/en 的双语字段');
  }
  if (!isDegreeLevel(record.degreeLevel)) {
    errors.push(
      `degreeLevel: 非法值 "${String(record.degreeLevel)}"，允许: ${EDUCATION_DEGREE_LEVELS.join(' | ')}`,
    );
  }
  if (!isStatus(record.status)) {
    errors.push(
      `status: 非法值 "${String(record.status)}"，允许: ${EDUCATION_STATUSES.join(' | ')}`,
    );
  }
  if (typeof record.public !== 'boolean') errors.push('public: 必须是布尔值');
  if (typeof record.featured !== 'boolean') errors.push('featured: 必须是布尔值');

  // 可选字段一旦配置就不能是空字段（AC2：空字段不显示，数据层也不留空值）
  for (const field of ['school', 'college', 'major', 'statusNote'] as const) {
    const value = record[field];
    if (value === undefined || value === null) continue;
    if (!isLocaleText(value)) errors.push(`${field}: 必须是含非空 zh/en 的双语字段`);
  }
  for (const field of ['courses', 'experiences', 'interests', 'detail'] as const) {
    const value = record[field];
    if (value === undefined || value === null) continue;
    if (!Array.isArray(value) || value.length === 0 || !value.every(isLocaleText)) {
      errors.push(`${field}: 必须是非空的含 zh/en 双语数组`);
    }
  }

  const start = normalizeEducationDate(record.startDate);
  if (!start) errors.push(`startDate: 非法或缺失 "${String(record.startDate)}"`);
  if (record.endDate !== undefined && record.endDate !== null && record.endDate !== '') {
    const end = normalizeEducationDate(record.endDate);
    if (!end) {
      errors.push(`endDate: 非法 "${String(record.endDate)}"`);
    } else if (start && end < start) {
      errors.push(`endDate: 不能早于 startDate（${String(record.endDate)} < ${String(record.startDate)}）`);
    }
  }

  // US-009 AC3 / PRD §8.3：备考研究生不得展示为已获得研究生学历
  if (record.degreeLevel === 'graduate') {
    if (record.status === 'Completed') {
      errors.push('研究生学历: 备考/在读阶段不得标记为 Completed（未获得的学历不能显示为已完成）');
    } else if (!isLocaleText(record.statusNote)) {
      errors.push('statusNote: 研究生未完成状态必须明确说明（如「备考中，尚未入学」）');
    }
  }

  for (const field of FORBIDDEN_EDUCATION_FIELDS) {
    if (field in record) errors.push(`${field}: 禁止伪装已获学历的字段`);
  }

  return errors;
}

/** 整表校验：空列表合法；slug 唯一、至少一条 public、featured 必须 public */
export function validateEducationList(items: unknown): string[] {
  if (!Array.isArray(items)) return ['education: 必须是数组'];
  if (items.length === 0) return [];

  const errors: string[] = [];
  const seen = new Set<string>();
  let hasPublic = false;

  items.forEach((item, index) => {
    for (const message of validateEducation(item)) {
      errors.push(`education[${index}]: ${message}`);
    }
    const record = item as Partial<EducationEntry> | null;
    if (record && typeof record === 'object') {
      if (isValidEducationSlug(record.slug)) {
        if (seen.has(record.slug)) errors.push(`education[${index}]: slug 重复 "${record.slug}"`);
        else seen.add(record.slug);
      }
      if (record.public === true) hasPublic = true;
      if (record.featured === true && record.public !== true) {
        errors.push(`education[${index}]: featured 条目必须 public`);
      }
    }
  });

  if (!hasPublic) errors.push('education: 至少需要一条 public 条目');
  return errors;
}

export function publicEducation(items: readonly EducationEntry[]): EducationEntry[] {
  return items.filter((item) => item.public);
}

/** 按开始时间倒序返回新数组，不修改入参 */
export function sortEducation(items: readonly EducationEntry[]): EducationEntry[] {
  return [...items].sort((a, b) => {
    const left = normalizeEducationDate(a.startDate) ?? '';
    const right = normalizeEducationDate(b.startDate) ?? '';
    return right.localeCompare(left);
  });
}

/** messages 键后缀：In Progress → statuses.InProgress */
export function educationStatusMessageKey(status: EducationStatus): string {
  return `statuses.${status.replace(/\s+/g, '')}`;
}
