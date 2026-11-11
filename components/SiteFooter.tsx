import Link from 'next/link';
import { profile } from '@/content/profile';

export default function SiteFooter({
  lang,
  languageName,
  languageHref,
}: {
  lang: 'zh' | 'en';
  languageName: string;
  languageHref: string;
}) {
  const isZh = lang === 'zh';

  return (
    <footer className="px-6 py-8 text-center text-sm opacity-60">
      {/* eslint-disable @next/next/no-html-link-for-pages -- /LICENSE* 是 public/ 下的静态文件，不是 Next 页面路由，必须用原生 a 标签 */}
      <div className="flex flex-col items-center gap-2">
        <Link href={languageHref}>{languageName}</Link>
        <p>
          © 2026 {profile.name.zh} / {profile.name.en}
          {' · '}
          {isZh ? '代码' : 'Code'}{' '}
          <a href="/LICENSE" className="underline decoration-accent/60 underline-offset-2">
            PolyForm Noncommercial 1.0.0
          </a>
          {' · '}
          {isZh ? '内容' : 'Content'}{' '}
          <a href="/LICENSE-CONTENT" className="underline decoration-accent/60 underline-offset-2">
            CC BY-NC-ND 4.0
          </a>
        </p>
        <p className="text-xs">
          {isZh
            ? '代码与内容均禁止商业使用；内容禁止演绎。详情见许可证全文。'
            : 'Code and content are noncommercial only; content may not be adapted. See the full licenses.'}
        </p>
      </div>
      {/* eslint-enable @next/next/no-html-link-for-pages */}
    </footer>
  );
}
