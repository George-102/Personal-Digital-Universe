import Link from 'next/link';

export default function SiteNav({ lang }: { lang: 'zh' | 'en' }) {
  const base = lang === 'en' ? '/en/' : '/';
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-white/10 bg-space/60 backdrop-blur">
      <nav aria-label={lang === 'zh' ? '主导航' : 'Main navigation'} className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3 text-sm">
        <Link href={base} className="font-semibold tracking-wide">
          {lang === 'zh' ? '首页' : 'Home'}
        </Link>
        <Link href={`${base}#about`} className="opacity-80 transition-opacity hover:opacity-100">
          About
        </Link>
      </nav>
    </header>
  );
}