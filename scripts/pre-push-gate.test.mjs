import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const hookPath = join(repoRoot, 'scripts', 'pre-push-gate.sh');

/**
 * 解析可用 POSIX shell 的绝对路径。
 * 必须是绝对路径：子进程 PATH 会被收紧（npm 缺失用例），相对名解析不到。
 */
function resolveSh() {
  if (process.platform === 'win32') {
    try {
      const found = spawnSync('where.exe', ['sh'], { encoding: 'utf8' });
      const first = (found.stdout || '').split(/\r?\n/).map((s) => s.trim()).find(Boolean);
      if (found.status === 0 && first) return first;
    } catch {
      // 落到下方手动探测
    }
    for (const fallback of ['C:\\Program Files\\Git\\bin\\sh.exe', 'C:\\Program Files\\Git\\usr\\bin\\sh.exe']) {
      if (existsSync(fallback)) return fallback;
    }
    return null;
  }
  try {
    const probe = spawnSync('sh', ['-c', 'command -v sh'], { encoding: 'utf8' });
    if (probe.status === 0 && probe.stdout.trim()) return probe.stdout.trim();
  } catch {
    // 无 sh
  }
  return null;
}

/**
 * 在临时目录运行 pre-push hook。
 * mode: 'ok' | 'fail' | 'no-node-modules' | 'no-npm'
 */
function runHook(mode) {
  const sh = resolveSh();
  assert.ok(sh, '需要 POSIX sh 才能执行 pre-push hook');
  const dir = mkdtempSync(join(tmpdir(), 'pre-push-gate-'));
  try {
    const binDir = join(dir, 'bin');
    mkdirSync(binDir);
    const logPath = join(dir, 'npm-args.log');

    if (mode !== 'no-npm') {
      // 桩 npm：记录参数，按 mode 决定退出码
      const stub = join(binDir, 'npm');
      const exitCode = mode === 'fail' ? 1 : 0;
      writeFileSync(
        stub,
        `#!/bin/sh\nprintf '%s\\n' "$*" > "$NPM_ARGS_LOG"\nexit ${exitCode}\n`,
      );
      chmodSync(stub, 0o755);
    }
    if (mode !== 'no-node-modules') {
      mkdirSync(join(dir, 'node_modules'));
    }

    const res = spawnSync(sh, [hookPath], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: mode === 'no-npm' ? binDir : `${binDir}:${process.env.PATH}`,
        NPM_ARGS_LOG: logPath,
      },
    });
    return {
      status: res.status,
      stdout: res.stdout || '',
      stderr: res.stderr || '',
      npmArgs: existsSync(logPath) ? readFileSync(logPath, 'utf8').trim() : null,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('门禁通过时放行（exit 0）且调用 npm run verify:local', () => {
  const res = runHook('ok');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.npmArgs, 'run verify:local');
  assert.match(res.stdout, /门禁通过/);
});

test('门禁失败时拒绝 push（exit 1）并提示 --no-verify 豁免', () => {
  const res = runHook('fail');
  assert.equal(res.status, 1);
  assert.equal(res.npmArgs, 'run verify:local');
  assert.match(res.stderr, /已阻止 push/);
  assert.match(res.stderr, /--no-verify/);
});

test('node_modules 缺失时拒绝并提示先运行 init', () => {
  const res = runHook('no-node-modules');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /node_modules/);
  assert.match(res.stderr, /init/);
  assert.equal(res.npmArgs, null, '不应调用 npm');
});

test('npm 缺失时拒绝并报错', () => {
  const res = runHook('no-npm');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /npm/);
});
