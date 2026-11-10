import { readFileSync } from 'node:fs';
import { argv, exit } from 'node:process';

const dir = argv[2] ?? 'messages';

function flattenKeys(value, prefix = '') {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) => flattenKeys(child, `${prefix}${key}.`));
  }
  return [prefix.slice(0, -1)];
}

function loadKeys(locale) {
  const file = `${dir}/${locale}.json`;
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`无法读取 ${file}: ${err.message}`);
    exit(1);
  }
  return new Set(flattenKeys(data));
}

const zh = loadKeys('zh');
const en = loadKeys('en');
const missingInEn = [...zh].filter((key) => !en.has(key));
const extraInEn = [...en].filter((key) => !zh.has(key));

if (missingInEn.length > 0 || extraInEn.length > 0) {
  for (const key of missingInEn) console.error(`en 缺少键: ${key}`);
  for (const key of extraInEn) console.error(`en 多余键: ${key}`);
  exit(1);
}

console.log(`i18n 键覆盖率 100%（zh ${zh.size} 键 / en ${en.size} 键）`);