import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

function readOut(path) {
  assert.ok(existsSync(path), `缺少 ${path}，请先 npm run build`);
  return readFileSync(path, 'utf8');
}

test('中文首页静态 HTML 含 Explore 入口与 #about 锚点', () => {
  const html = readOut('out/index.html');
  assert.match(html, /href="#about"/, '缺少 Explore 入口链接');
  assert.match(html, /id="about"/, '缺少 #about 占位 section');
});

test('英文首页静态 HTML 含 Explore 入口', () => {
  const html = readOut('out/en/index.html');
  assert.match(html, /href="#about"/, '英文首页缺少 Explore 入口链接');
});

test('首页静态 HTML 含 OG meta 与 Person JSON-LD', () => {
  const html = readOut('out/index.html');
  assert.match(html, /property="og:title"/, '缺少 og:title');
  assert.match(html, /application\/ld\+json/, '缺少 JSON-LD');
  assert.match(html, /"Person"/, 'JSON-LD 不是 Person 类型');
});