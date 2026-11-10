import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-i18n.mjs');

function runChecker(files) {
  const dir = mkdtempSync(join(tmpdir(), 'i18n-check-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dir, name), JSON.stringify(content));
    }
    return spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('键完全一致时通过（含嵌套键）', () => {
  const res = runChecker({
    'zh.json': { nav: { home: '首页' }, hero: { explore: '探索' } },
    'en.json': { nav: { home: 'Home' }, hero: { explore: 'Explore' } },
  });
  assert.equal(res.status, 0, res.stderr);
});

test('en 缺少键时失败并指出缺失键', () => {
  const res = runChecker({
    'zh.json': { nav: { home: '首页', about: '关于' } },
    'en.json': { nav: { home: 'Home' } },
  });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /nav\.about/);
});

test('en 多余键时失败并指出多余键', () => {
  const res = runChecker({
    'zh.json': { nav: { home: '首页' } },
    'en.json': { nav: { home: 'Home', about: 'About' } },
  });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /nav\.about/);
});

test('语言文件缺失时失败并指出文件名', () => {
  const res = runChecker({ 'zh.json': { a: '甲' } });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /en\.json/);
});