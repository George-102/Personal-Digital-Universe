import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { profile } from '@/content/profile';
import HeroBackground from '@/components/HeroBackground';
import HeroCanvas from '@/components/three/HeroCanvas';
import ScrollDriver from '@/components/ScrollDriver';
import { findTransitionSegment, transitionSegments } from '@/lib/transitions';

// 面板展开参数只从注册表读取（US-003b），组件内不硬编码
const heroSegment = findTransitionSegment(transitionSegments, 'hero-about');
const panel = heroSegment?.panel ?? { risePx: 0, tiltDeg: 0, minOpacity: 1 };
const panelStyle = {
  '--panel-rise': `${panel.risePx}px`,
  '--panel-tilt': `${panel.tiltDeg}deg`,
  '--panel-min-opacity': String(panel.minOpacity),
} as CSSProperties;

export default async function HomeSections({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Home' });
  const ti = await getTranslations({ locale: lang, namespace: 'Interaction' });
  // 用根路径锚点，避免与 Explore 的 href="#about" 在既有用例的定位器中产生歧义
  const fallbackHref = lang === 'en' ? '/en/#about' : '/#about';

  return (
    <>
      <section
        id="home"
        className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <HeroBackground />
        <ScrollDriver />
        <HeroCanvas labels={{ core: ti('core'), orbitNode: ti('orbitNode') }} />
        {/* 文字层不拦截指针，3D 物体才能收到 hover；链接单独恢复可点击 */}
        <div className="pointer-events-none relative flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-wide">{profile.name[lang]}</h1>
          <p className="text-lg opacity-90">{profile.tagline[lang]}</p>
          <p className="font-mono text-sm opacity-70">{profile.status[lang]}</p>
          <p className="max-w-xl text-sm opacity-60">{t('tagline')}</p>
          <a
            href="#about"
            className="pointer-events-auto mt-6 rounded-full border border-accent/60 px-6 py-2 text-sm text-accent transition-opacity hover:opacity-70"
          >
            {t('explore')}
          </a>
          {/* 3D 点击的 DOM 等价入口：键盘、无 WebGL、触摸用户均可直接访问内容 */}
          <a
            href={fallbackHref}
            data-interaction-fallback
            className="pointer-events-auto max-w-xs text-xs opacity-60 underline decoration-accent/40 underline-offset-4 transition-opacity hover:opacity-100"
          >
            {ti('fallback')}
          </a>
          <p data-interaction-hint className="max-w-xs text-[11px] opacity-50">
            {ti('hint')}
          </p>
        </div>
        <div
          data-scroll-hint
          className="scroll-hint pointer-events-none absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-1 text-xs opacity-70"
        >
          <span>{t('scrollHint')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>
      <section id="about" className="mx-auto min-h-[50vh] max-w-3xl px-6 py-24">
        <div className="about-panel" style={panelStyle}>
          <h2 className="text-2xl font-semibold">About</h2>
          <p className="mt-4 opacity-70">{t('aboutPlaceholder')}</p>
        </div>
      </section>
    </>
  );
}
