import { test, expect } from 'vitest';
import { navItems } from '../lib/nav.ts';
import {
  activeSectionAt,
  sectionFromPathname,
  sectionTintFor,
  sectionVisualFor,
  sectionVisuals,
  validateSectionVisuals,
} from '../lib/section-state.ts';

test('sectionVisuals 覆盖全部 nav 模块且顺序一致、颜色合法', () => {
  expect(validateSectionVisuals(sectionVisuals, navItems)).toEqual([]);
  expect(sectionVisuals.map((item) => item.id)).toEqual(navItems.map((item) => item.id));
  for (const item of sectionVisuals) {
    expect(item.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(item.glow).toMatch(/^#[0-9a-f]{6}$/i);
    expect(item.particle).toMatch(/^#[0-9a-f]{6}$/i);
  }
});

test('sectionVisualFor 未知 id 回退首页，不会返回 undefined', () => {
  expect(sectionVisualFor('home').id).toBe('home');
  expect(sectionVisualFor('ghost').id).toBe('home');
  expect(sectionTintFor('about')).toBe(sectionVisualFor('about').particle);
  expect(sectionTintFor('')).toBe(sectionVisualFor('home').particle);
});

test('activeSectionAt 用 40% 判定线，滚到底取最后一个模块', () => {
  const sections = [
    { id: 'home', top: 0 },
    { id: 'about', top: 900 },
    { id: 'journey', top: 1800 },
  ];
  expect(activeSectionAt(sections, 0, 900, 3000)).toBe('home');
  expect(activeSectionAt(sections, 500, 900, 3000)).toBe('home');
  expect(activeSectionAt(sections, 700, 900, 3000)).toBe('about');
  expect(activeSectionAt(sections, 2100, 900, 2100)).toBe('journey');
  expect(activeSectionAt([], 500, 900, 1000)).toBe('home');
});

test('sectionFromPathname 把独立路由映射到对应模块', () => {
  expect(sectionFromPathname('/')).toBe('home');
  expect(sectionFromPathname('/en')).toBe('home');
  expect(sectionFromPathname('/research')).toBe('research');
  expect(sectionFromPathname('/en/research/llm-marl')).toBe('research');
  expect(sectionFromPathname('/projects')).toBe('projects');
  expect(sectionFromPathname('/unknown')).toBe('home');
});

test('validateSectionVisuals 拒绝缺失、重复与非法颜色', () => {
  expect(validateSectionVisuals([sectionVisuals[0]], navItems).some((e) => e.includes('缺失'))).toBe(true);
  expect(validateSectionVisuals([sectionVisuals[0], sectionVisuals[0]], navItems).some((e) => e.includes('重复'))).toBe(true);
  const broken = [{ ...sectionVisuals[0], accent: 'red' }, ...sectionVisuals.slice(1)];
  expect(validateSectionVisuals(broken, navItems).some((e) => e.includes('accent'))).toBe(true);
});
