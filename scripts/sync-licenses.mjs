import { copyFileSync, mkdirSync } from 'node:fs';

// 根目录许可证是唯一来源；构建前同步到 public/，让静态站点可通过 /LICENSE 访问。
mkdirSync('public', { recursive: true });
for (const name of ['LICENSE', 'LICENSE-CONTENT']) {
  copyFileSync(name, `public/${name}`);
  console.log(`synced ${name} -> public/${name}`);
}
