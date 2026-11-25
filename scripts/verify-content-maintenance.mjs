import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDED = new Set([
  '.git',
  '.next',
  '.workbuddy',
  'coverage',
  'node_modules',
  'out',
  'playwright-report',
  'test-results',
]);

const ZH_NAME = '内容维护验收用户';
const EN_NAME = 'Content Maintenance Tester';
const PROJECT_SLUG = 'content-maintenance-acceptance';
const PROJECT_NAME_ZH = '内容维护验收项目';
const PRODUCT_NAME = 'Airspace Lab';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function replaceProfileName(source, zh, en) {
  const pattern = /(name:\s*\{\s*zh:\s*)'[^']*'(\s*,\s*en:\s*)'[^']*'(\s*,?\s*\})/;
  if (!pattern.test(source)) throw new Error('profile.ts 的 name 双语字段格式已变化，请更新验收脚本');
  return source.replace(pattern, `$1'${zh}'$2'${en}'$3`);
}

export function appendProject(source, project) {
  const end = source.lastIndexOf('];');
  if (end < 0) throw new Error('projects.ts 的数组结尾未找到');
  const literal = JSON.stringify(project, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
  return `${source.slice(0, end)}${literal},\n${source.slice(end)}`;
}

function fieldValueEnd(source, start) {
  let index = start;
  while (/\s/.test(source[index] ?? '')) index += 1;
  const opener = source[index];
  if (opener === '{' || opener === '[') {
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (; index < source.length; index += 1) {
      const char = source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === "'" || char === '"' || char === '`') {
        quote = char;
      } else if (char === opener) {
        depth += 1;
      } else if (char === closer) {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          break;
        }
      }
    }
    if (depth !== 0) throw new Error('字段对象括号未闭合');
  } else {
    while (index < source.length && source[index] !== ',' && source[index] !== '\n') index += 1;
  }
  if (source[index] === ',') index += 1;
  if (source[index] === '\r') index += 1;
  if (source[index] === '\n') index += 1;
  return index;
}

export function removeFirstEntryFields(source, fields) {
  let next = source;
  for (const field of fields) {
    const match = new RegExp(`(^|\\n)[ \\t]{2,}${escapeRegExp(field)}\\s*:`, 'm').exec(next);
    if (!match) throw new Error(`首条内容中未找到可选字段 ${field}`);
    const start = match.index + (match[1] ? 1 : 0);
    const valueStart = match.index + match[0].length;
    const end = fieldValueEnd(next, valueStart);
    next = `${next.slice(0, start)}${next.slice(end)}`;
  }
  return next;
}

export function replaceFirstUrl(source, url) {
  const pattern = /(\burl:\s*)'[^']*'/;
  if (!pattern.test(source)) throw new Error('products.ts 中未找到 url 字段');
  return source.replace(pattern, `$1'${url}'`);
}

export function assertHtmlContains(html, markers) {
  const missing = markers.filter((marker) => !html.includes(marker));
  if (missing.length > 0) {
    throw new Error(`静态产物缺少标记：${missing.join(' / ')}`);
  }
}

async function copyWorkspace(tempDir) {
  await cp(ROOT, tempDir, {
    recursive: true,
    filter: (source) => {
      const base = path.basename(source);
      if (EXCLUDED.has(base)) return false;
      return !base.startsWith('.tmp-');
    },
  });
  await symlink(path.join(ROOT, 'node_modules'), path.join(tempDir, 'node_modules'), 'junction');
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', windowsHide: true });
  if (result.error) throw result.error;
  return result;
}

function runChecked(command, args, cwd) {
  const result = runCommand(command, args, cwd);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} 失败（${result.status}）：\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  }
  return result;
}

function npmArgs(script) {
  if (process.env.npm_execpath) {
    return { command: process.execPath, args: [process.env.npm_execpath, 'run', script] };
  }
  return { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', args: ['run', script] };
}

async function runAcceptance() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'pdu-content-maintenance-'));
  try {
    await copyWorkspace(tempDir);
    const contentDir = path.join(tempDir, 'content');

    const profilePath = path.join(contentDir, 'profile.ts');
    const profileSource = await readFile(profilePath, 'utf8');
    await writeFile(profilePath, replaceProfileName(profileSource, ZH_NAME, EN_NAME));

    const projectsPath = path.join(contentDir, 'projects.ts');
    const projectsSource = await readFile(projectsPath, 'utf8');
    await writeFile(projectsPath, appendProject(projectsSource, {
      slug: PROJECT_SLUG,
      repo: 'George-102/content-maintenance-acceptance',
      name: PROJECT_NAME_ZH,
      description: { zh: '验收用临时项目。', en: 'Temporary acceptance project.' },
      stack: ['Markdown'],
      category: 'other',
      status: 'active',
      featured: false,
      public: true,
    }));

    const productsPath = path.join(contentDir, 'products.ts');
    const productsSource = await readFile(productsPath, 'utf8');
    const trimmedProducts = removeFirstEntryFields(productsSource, ['detail', 'repo']);
    await writeFile(productsPath, trimmedProducts);

    const build = npmArgs('build');
    runChecked(build.command, build.args, tempDir);

    const readOut = async (relative) => readFile(path.join(tempDir, 'out', relative), 'utf8');
    assertHtmlContains(await readOut(path.join('index.html')), [ZH_NAME]);
    assertHtmlContains(await readOut(path.join('en', 'index.html')), [EN_NAME]);
    assertHtmlContains(await readOut(path.join('projects', 'index.html')), [PROJECT_SLUG, PROJECT_NAME_ZH]);
    assertHtmlContains(await readOut(path.join('en', 'projects', 'index.html')), [PROJECT_SLUG]);
    assertHtmlContains(await readOut(path.join('products', 'index.html')), [
      PRODUCT_NAME,
      'data-product-has-cover="false"',
      'product-cover--placeholder',
    ]);

    await writeFile(productsPath, replaceFirstUrl(productsSource, 'javascript:alert(1)'));
    const invalid = runCommand(process.execPath, ['scripts/validate-content.mjs'], tempDir);
    if (invalid.status === 0) throw new Error('非法 url 未被 prebuild 校验拒绝');
    if (!(invalid.stderr ?? '').includes('url')) {
      throw new Error(`prebuild 拒绝原因不是 url 字段：${invalid.stderr ?? ''}`);
    }

    console.log('内容维护验收通过：AC1 内容修改 / AC2 新增项目 / AC3 缺字段容错 / AC4 资源降级。');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runAcceptance();
  } catch (error) {
    console.error(`内容维护验收失败：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
