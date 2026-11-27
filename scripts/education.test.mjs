import { test, expect } from 'vitest';
import {
  EDUCATION_STATUSES,
  EDUCATION_DEGREE_LEVELS,
  FORBIDDEN_EDUCATION_FIELDS,
  isValidEducationSlug,
  normalizeEducationDate,
  validateEducation,
  validateEducationList,
  publicEducation,
  sortEducation,
  educationStatusMessageKey,
} from '../lib/education.ts';

const undergraduate = (overrides = {}) => ({
  slug: 'scu-bachelor',
  school: { zh: '本科院校', en: 'Undergraduate university' },
  college: { zh: '计算机学院', en: 'School of Computer Science' },
  major: { zh: '计算机科学与技术', en: 'Computer Science and Technology' },
  degree: { zh: '本科在读', en: 'Bachelor (in progress)' },
  degreeLevel: 'undergraduate',
  status: 'In Progress',
  startDate: '2023-09',
  endDate: '2027-06',
  courses: [{ zh: '数据结构', en: 'Data Structures' }],
  featured: true,
  public: true,
  ...overrides,
});

const graduate = (overrides = {}) => ({
  slug: 'graduate-preparation',
  degree: { zh: '硕士研究生（备考中）', en: 'Master (preparing)' },
  degreeLevel: 'graduate',
  status: 'In Progress',
  startDate: '2026',
  statusNote: {
    zh: '备考中，尚未入学；研究生学历尚未获得。',
    en: 'Preparing for graduate entrance exams — not enrolled; no graduate degree has been awarded.',
  },
  featured: true,
  public: true,
  ...overrides,
});

test('EDUCATION_STATUSES 严格对应 PRD 三态，degreeLevel 只有两级', () => {
  expect([...EDUCATION_STATUSES]).toEqual(['Completed', 'In Progress', 'Planned']);
  expect([...EDUCATION_DEGREE_LEVELS]).toEqual(['undergraduate', 'graduate']);
});

test('isValidEducationSlug 只接受小写 kebab-case', () => {
  expect(isValidEducationSlug('scu-bachelor')).toBe(true);
  expect(isValidEducationSlug('graduate-preparation-2')).toBe(true);
  expect(isValidEducationSlug('SCU')).toBe(false);
  expect(isValidEducationSlug('-lead')).toBe(false);
  expect(isValidEducationSlug('has space')).toBe(false);
  expect(isValidEducationSlug('')).toBe(false);
});

test('normalizeEducationDate 接受 YYYY / YYYY-MM 并拒绝越界月份', () => {
  expect(normalizeEducationDate('2023-09')).toBe('2023-09');
  expect(normalizeEducationDate('2026')).toBe('2026-00');
  expect(normalizeEducationDate('2023-13')).toBeNull();
  expect(normalizeEducationDate('2023/09')).toBeNull();
  expect(normalizeEducationDate(undefined)).toBeNull();
});

test('validateEducation 接受合法条目（可选字段全部缺省仍合法）', () => {
  expect(validateEducation(undergraduate())).toEqual([]);
  expect(validateEducation(graduate())).toEqual([]);
  expect(validateEducation(graduate({ school: undefined, courses: undefined }))).toEqual([]);
});

test('validateEducation 拒绝缺失必填字段', () => {
  expect(validateEducation(undergraduate({ slug: undefined })).join()).toContain('slug');
  expect(validateEducation(undergraduate({ degree: undefined })).join()).toContain('degree');
  expect(validateEducation(undergraduate({ status: undefined })).join()).toContain('status');
  expect(validateEducation(undergraduate({ startDate: undefined })).join()).toContain('startDate');
  expect(validateEducation(undergraduate({ public: undefined })).join()).toContain('public');
});

test('validateEducation 拒绝非法状态与学历层级', () => {
  expect(validateEducation(undergraduate({ status: 'Graduated' })).join()).toContain('status');
  expect(validateEducation(undergraduate({ degreeLevel: 'master' })).join()).toContain('degreeLevel');
});

test('validateEducation 拒绝矛盾时间', () => {
  expect(validateEducation(undergraduate({ endDate: '2022-01' })).join()).toContain('endDate');
  expect(validateEducation(undergraduate({ endDate: 'not-a-date' })).join()).toContain('endDate');
  expect(validateEducation(undergraduate({ endDate: undefined }))).toEqual([]);
});

test('validateEducation 拒绝空字段伪装与非法双语字段', () => {
  expect(validateEducation(undergraduate({ school: { zh: '', en: 'University' } })).join()).toContain('school');
  expect(validateEducation(undergraduate({ courses: [] })).join()).toContain('courses');
  expect(validateEducation(undergraduate({ college: '' })).join()).toContain('college');
  expect(validateEducation(undergraduate({ statusNote: { zh: '只有中文' } })).join()).toContain('statusNote');
});

test('AC3 研究生备考条目禁止标记为已完成学历', () => {
  const errors = validateEducation(graduate({ status: 'Completed' }));
  expect(errors.join()).toContain('研究生');
  expect(errors.join()).toContain('Completed');
});

test('研究生未完成状态必须给出明确状态说明', () => {
  expect(validateEducation(graduate({ statusNote: undefined })).join()).toContain('statusNote');
  expect(validateEducation(graduate({ status: 'Planned', statusNote: undefined })).join()).toContain('statusNote');
  expect(validateEducation(undergraduate({ statusNote: undefined }))).toEqual([]);
});

test('构建期拒绝伪装已获学历的禁止字段', () => {
  expect(FORBIDDEN_EDUCATION_FIELDS.length).toBeGreaterThan(0);
  for (const field of FORBIDDEN_EDUCATION_FIELDS) {
    const errors = validateEducation(graduate({ [field]: true }));
    expect(errors.join(), field).toContain(field);
  }
});

test('validateEducationList 检查 slug 唯一与至少一条 public', () => {
  expect(validateEducationList([undergraduate(), graduate()])).toEqual([]);
  expect(validateEducationList([])).toEqual([]);
  expect(validateEducationList([undergraduate(), undergraduate()]).join()).toContain('重复');
  expect(validateEducationList([undergraduate({ public: false })]).join()).toContain('public');
  expect(validateEducationList([undergraduate({ featured: true, public: false }), graduate()]).join()).toContain('featured');
});

test('publicEducation 与 sortEducation 按公开性与开始时间倒序返回新数组', () => {
  const hidden = graduate({ slug: 'hidden', public: false });
  const source = [graduate({ slug: 'now', startDate: '2026' }), hidden, undergraduate({ slug: 'old', startDate: '2023-09' })];
  const result = sortEducation(publicEducation(source));
  expect(result.map((item) => item.slug)).toEqual(['now', 'old']);
  expect(source.map((item) => item.slug)).toEqual(['now', 'hidden', 'old']);
});

test('educationStatusMessageKey 生成 messages 键后缀', () => {
  expect(educationStatusMessageKey('Completed')).toBe('statuses.Completed');
  expect(educationStatusMessageKey('In Progress')).toBe('statuses.InProgress');
  expect(educationStatusMessageKey('Planned')).toBe('statuses.Planned');
});
