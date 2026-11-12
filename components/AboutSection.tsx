import { getTranslations } from 'next-intl/server';
import type { CSSProperties } from 'react';
import { about } from '@/content';
import { resolveAbout } from '@/lib/about';
import { findTransitionSegment, transitionSegments } from '@/lib/transitions';
import AboutPortrait from '@/components/AboutPortrait';

// 面板展开参数只从转场注册表读取（US-003f），组件内不硬编码
const heroSegment = findTransitionSegment(transitionSegments, 'hero-about');
const panel = heroSegment?.panel ?? { risePx: 0, tiltDeg: 0, minOpacity: 1 };
const panelStyle = {
  '--panel-rise': `${panel.risePx}px`,
  '--panel-tilt': `${panel.tiltDeg}deg`,
  '--panel-min-opacity': String(panel.minOpacity),
} as CSSProperties;

/**
 * US-006：个人介绍区域。服务端渲染，全部正文与要点进入静态 HTML，
 * 不依赖 JS / WebGL / Canvas（开发红线 1、DoD C 组）。
 */
export default async function AboutSection({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'About' });
  const data = resolveAbout(about, lang);

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-28"
    >
      <div className="about-panel" style={panelStyle}>
        <p data-about-eyebrow className="font-mono text-xs tracking-[0.3em] text-accent/80">
          {t('eyebrow')}
        </p>
        <h2 id="about-title" className="mt-3 text-3xl font-semibold tracking-wide md:text-4xl">
          {t('title')}
        </h2>

        <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-14">
          <AboutPortrait
            label={t('portraitLabel')}
            alt={t('avatarAlt')}
            fallback={t('avatarFallback')}
          />

          <div className="min-w-0">
            <div data-about-copy className="about-copy space-y-4 text-[15px] leading-7">
              {data.bio.map((paragraph, index) => (
                <p key={index} data-about-bio>
                  {paragraph}
                </p>
              ))}
            </div>

            <h3 className="mt-8 font-mono text-xs tracking-[0.2em] text-accent/80">
              {t('highlights')}
            </h3>
            <ul data-about-highlights className="mt-3 flex flex-wrap gap-2">
              {data.highlights.map((highlight, index) => (
                <li
                  key={index}
                  data-about-highlight
                  className="max-w-full break-words rounded-full border border-ink/15 bg-space-soft/70 px-3 py-1.5 text-xs text-ink/80"
                >
                  {highlight}
                </li>
              ))}
            </ul>

            {/* 未配置 cvUrl 时不渲染任何入口（PRD 验收 5 / DoD B 组） */}
            {data.cvUrl && (
              <a
                href={data.cvUrl}
                download
                data-cv
                className="mt-8 inline-flex rounded-full border border-accent/60 px-6 py-2 text-sm text-accent transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {t('downloadCv')}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
