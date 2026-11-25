import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

function readOut(path) {
  expect(existsSync(path)).toBeTruthy();
  return readFileSync(path, 'utf8');
}

test('中文首页静态 HTML 含 Explore 入口与 #about 锚点', () => {
  const html = readOut('out/index.html');
  expect(html, '缺少 Explore 入口链接').toMatch(/href="#about"/);
  expect(html, '缺少 #about 占位 section').toMatch(/id="about"/);
});

test('英文首页静态 HTML 含 Explore 入口', () => {
  const html = readOut('out/en/index.html');
  expect(html, '英文首页缺少 Explore 入口链接').toMatch(/href="#about"/);
});

test('首页静态 HTML 含 OG meta 与 Person JSON-LD', () => {
  const html = readOut('out/index.html');
  expect(html, '缺少 og:title').toMatch(/property="og:title"/);
  expect(html, '缺少 JSON-LD').toMatch(/application\/ld\+json/);
  expect(html, 'JSON-LD 不是 Person 类型').toMatch(/"Person"/);
});