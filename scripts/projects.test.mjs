import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  assert.deepEqual([...PROJECT_CATEGORIES].sort(), [
    'ai-ml',
    'dev-tools',
    'other',
    'research',
    'web',
  ]);
  assert.deepEqual([...PROJECT_STATUS].sort(), ['active', 'archived', 'completed', 'maintained']);
});

test('isValidProjectSlug 只允许小写 kebab-case', () => {
  assert.equal(isValidProjectSlug('aics-learning-guide'), true);
  assert.equal(isValidProjectSlug('what-to-do'), true);
  assert.equal(isValidProjectSlug('Bad Slug'), false);
  assert.equal(isValidProjectSlug('UPPER'), false);
  assert.equal(isValidProjectSlug('-lead'), false);
  assert.equal(isValidProjectSlug('trail-'), false);
  assert.equal(isValidProjectSlug(''), false);
});

test('isValidRepoFullName 只接受 owner/name 形式', () => {
  assert.equal(isValidRepoFullName('George-102/AICS_Learning_Guide'), true);
  assert.equal(isValidRepoFullName('George-102/toyOS'), true);
  assert.equal(isValidRepoFullName('George-102'), false);
  assert.equal(isValidRepoFullName('/repo'), false);
  assert.equal(isValidRepoFullName('owner/'), false);
  assert.equal(isValidRepoFullName('own er/repo'), false);
  assert.equal(isValidRepoFullName('javascript:alert(1)'), false);
});

test('validateProject 通过合法条目（含 detail / stars / image / repoPrivate）', () => {
  assert.deepEqual(
    validateProject(
      entry({
        detail: { zh: '完整介绍。', en: 'Full introduction.' },
        stars: 12,
        image: '/images/project.png',
        repoPrivate: true,
      }),
    ),
    [],
  );
});

test('validateProject 拒绝非法 slug、repo、分类、状态', () => {
  assert.ok(validateProject(entry({ slug: 'Bad Slug' })).some((e) => e.includes('slug')));
  assert.ok(validateProject(entry({ repo: 'javascript:alert(1)' })).some((e) => e.includes('repo')));
  assert.ok(validateProject(entry({ category: 'unknown' })).some((e) => e.includes('category')));
  assert.ok(validateProject(entry({ status: 'Done' })).some((e) => e.includes('status')));
});

test('validateProject 拒绝单语字段、空技术栈与非法可选字段', () => {
  assert.ok(
    validateProject(entry({ description: { zh: '只有中文' } })).some((e) =>
      e.includes('description'),
    ),
  );
  assert.ok(validateProject(entry({ stack: [] })).some((e) => e.includes('stack')));
  assert.ok(
    validateProject(entry({ stack: ['TS', ''] })).some((e) => e.includes('stack')),
  );
  assert.ok(
    validateProject(entry({ detail: { zh: '只有中文' } })).some((e) => e.includes('detail')),
  );
  assert.ok(validateProject(entry({ stars: -1 })).some((e) => e.includes('stars')));
  assert.ok(
    validateProject(entry({ image: 'javascript:alert(1)' })).some((e) => e.includes('image')),
  );
  assert.ok(validateProject(entry({ featured: 'yes' })).some((e) => e.includes('featured')));
  assert.ok(validateProject(entry({ public: 'yes' })).some((e) => e.includes('public')));
});

test('validateProject 缺必填字段时报错', () => {
  const missing = entry();
  delete missing.repo;
  assert.ok(validateProject(missing).some((e) => e.includes('repo')));
});

test('validateProjectList 空列表合法，重复 slug/repo 与全非公开被拒绝', () => {
  assert.deepEqual(validateProjectList([]), []);
  assert.deepEqual(validateProjectList([entry()]), []);
  const dupSlug = validateProjectList([entry(), entry({ repo: 'George-102/toyOS' })]);
  assert.ok(dupSlug.some((e) => e.includes('slug') && e.includes('重复')));
  const dupRepo = validateProjectList([
    entry(),
    entry({ slug: 'other-project', name: 'Other' }),
  ]);
  assert.ok(dupRepo.some((e) => e.includes('repo') && e.includes('重复')));
  assert.ok(
    validateProjectList([entry({ public: false })]).some((e) => e.includes('public')),
  );
});

test('validateProjectList featured 条目必须 public', () => {
  const errors = validateProjectList([entry({ public: false, featured: true })]);
  assert.ok(errors.some((e) => e.includes('featured')));
});

test('publicProjects 过滤非公开条目，findProjectBySlug 按 slug 查找', () => {
  const list = [
    entry(),
    entry({ slug: 'hidden-project', repo: 'George-102/hidden', public: false, featured: false }),
  ];
  assert.deepEqual(
    publicProjects(list).map((item) => item.slug),
    ['aics-learning-guide'],
  );
  assert.equal(findProjectBySlug(list, 'aics-learning-guide')?.repo, 'George-102/AICS_Learning_Guide');
  assert.equal(findProjectBySlug(list, 'nope'), undefined);
  assert.equal(findProjectBySlug(list, ''), undefined);
});

test('githubRepoUrl 与 projectHref 构造正确地址', () => {
  assert.equal(githubRepoUrl('George-102/AICS_Learning_Guide'), 'https://github.com/George-102/AICS_Learning_Guide');
  assert.equal(projectHref('zh'), '/projects/');
  assert.equal(projectHref('en'), '/en/projects/');
});
