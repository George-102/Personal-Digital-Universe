import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// init.sh / init.ps1 共用的配置冒烟验证，避免各入口重复拼接 node -e 字符串。
JSON.parse(readFileSync('feature_list.json', 'utf8'));
console.log('feature_list.json OK');

require('../lighthouserc.js');
console.log('lighthouserc.js OK');
