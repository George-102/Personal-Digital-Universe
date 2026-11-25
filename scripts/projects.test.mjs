import { test, expect } from 'vitest';
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUS,
  isValidProjectSlug,
  isValidRepoFullName,
  validateProject,
  validateProjectList,
  publicProjects,
  findProjectBySlug,
  githubRepoUrl,
  projectHref,
} from '../lib/projects.ts';

const entry = (overrides = {}) => ({
  slug: 'aics-learning-guide',
  repo: 'George-102/AICS_Learning_Guide',
  name: 'AICS Learning Guide',
  description: { zh: '面向 CS 学生的开源学习路线。', en: 'An open-source roadmap for CS students.' },
  stack: ['HTML', 'Markdown'],
  category: 'ai-ml',
  status: 'active',
  featured: true,
  public: true,
  ...overrides,
});

test('PROJECT_CATEGORIES 覆盖 PRD 五分类；PROJECT_STATUS 限定四态', () => {
  expect([...PROJECT_CATEGORIES].sort()).toEqual([
    'ai-ml',
    'dev-tools',
    'other',
    'research',
    'web',
  ]);
  expect([...PROJECT_STATUS].sort()).toEqual(['active', 'archived', 'completed', 'maintained']);
});

test('isValidProjectSlug 只允许小写 kebab-case', () => {
  expect(isValidProjectSlug('aics-learning-guide')).toBe(true);
  expect(isValidProjectSlug('what-to-do')).toBe(true);
  expect(isValidProjectSlug('Bad Slug')).toBe(false);
  expect(isValidProjectSlug('UPPER')).toBe(false);
  expect(isValidProjectSlug('-lead')).toBe(false);
  expect(isValidProjectSlug('trail-')).toBe(false);
  expect(isValidProjectSlug('')).toBe(false);
});

test('isValidRepoFullName 只接受 owner/name 形式', () => {
  expect(isValidRepoFullName('George-102/AICS_Learning_Guide')).toBe(true);
  expect(isValidRepoFullName('George-102/toyOS')).toBe(true);
  expect(isValidRepoFullName('George-102')).toBe(false);
  expect(isValidRepoFullName('/repo')).toBe(false);
  expect(isValidRepoFullName('owner/')).toBe(false);
  expect(isValidRepoFullName('own er/repo')).toBe(false);
  expect(isValidRepoFullName('javascript:alert(1)')).toBe(false);
});

test('validateProject 通过合法条目（含 detail / stars / image / repoPrivate）', () => {
  expect(validateProject(
      entry({
        detail: { zh: '完整介绍。', en: 'Full introduction.' },
        stars: 12,
        image: '/images/project.png',
        repoPrivate: true,
      }),
    )).toEqual([]);
});

test('validateProject 拒绝非法 slug、repo、分类、状态', () => {
  expect(validateProject(entry({ slug: 'Bad Slug' })).some((e) => e.includes('slug'))).toBeTruthy();
  expect(validateProject(entry({ repo: 'javascript:alert(1)' })).some((e) => e.includes('repo'))).toBeTruthy();
  expect(validateProject(entry({ category: 'unknown' })).some((e) => e.includes('category'))).toBeTruthy();
  expect(validateProject(entry({ status: 'Done' })).some((e) => e.includes('status'))).toBeTruthy();
});

test('validateProject 拒绝单语字段、空技术栈与非法可选字段', () => {
  expect(validateProject(entry({ description: { zh: '只有中文' } })).some((e) =>
      e.includes('description'),
    )).toBeTruthy();
  expect(validateProject(entry({ stack: [] })).some((e) => e.includes('stack'))).toBeTruthy();
  expect(validateProject(entry({ stack: ['TS', ''] })).some((e) => e.includes('stack'))).toBeTruthy();
  expect(validateProject(entry({ detail: { zh: '只有中文' } })).some((e) => e.includes('detail'))).toBeTruthy();
  expect(validateProject(entry({ stars: -1 })).some((e) => e.includes('stars'))).toBeTruthy();
  expect(validateProject(entry({ image: 'javascript:alert(1)' })).some((e) => e.includes('image'))).toBeTruthy();
  expect(validateProject(entry({ featured: 'yes' })).some((e) => e.includes('featured'))).toBeTruthy();
  expect(validateProject(entry({ public: 'yes' })).some((e) => e.includes('public'))).toBeTruthy();
});

test('validateProject 缺必填字段时报错', () => {
  const missing = entry();
  delete missing.repo;
  expect(validateProject(missing).some((e) => e.includes('repo'))).toBeTruthy();
});

test('validateProjectList 空列表合法，重复 slug/repo 与全非公开被拒绝', () => {
  expect(validateProjectList([])).toEqual([]);
  expect(validateProjectList([entry()])).toEqual([]);
  const dupSlug = validateProjectList([entry(), entry({ repo: 'George-102/toyOS' })]);
  expect(dupSlug.some((e) => e.includes('slug') && e.includes('重复'))).toBeTruthy();
  const dupRepo = validateProjectList([
    entry(),
    entry({ slug: 'other-project', name: 'Other' }),
  ]);
  expect(dupRepo.some((e) => e.includes('repo') && e.includes('重复'))).toBeTruthy();
  expect(validateProjectList([entry({ public: false })]).some((e) => e.includes('public'))).toBeTruthy();
});

test('validateProjectList featured 条目必须 public', () => {
  const errors = validateProjectList([entry({ public: false, featured: true })]);
  expect(errors.some((e) => e.includes('featured'))).toBeTruthy();
});

test('publicProjects 过滤非公开条目，findProjectBySlug 按 slug 查找', () => {
  const list = [
    entry(),
    entry({ slug: 'hidden-project', repo: 'George-102/hidden', public: false, featured: false }),
  ];
  expect(publicProjects(list).map((item) => item.slug)).toEqual(['aics-learning-guide']);
  expect(findProjectBySlug(list, 'aics-learning-guide')?.repo).toBe('George-102/AICS_Learning_Guide');
  expect(findProjectBySlug(list, 'nope')).toBe(undefined);
  expect(findProjectBySlug(list, '')).toBe(undefined);
});

test('githubRepoUrl 与 projectHref 构造正确地址', () => {
  expect(githubRepoUrl('George-102/AICS_Learning_Guide')).toBe('https://github.com/George-102/AICS_Learning_Guide');
  expect(projectHref('zh')).toBe('/projects/');
  expect(projectHref('en')).toBe('/en/projects/');
});
