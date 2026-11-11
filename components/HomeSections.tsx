import { getTranslations } from 'next-intl/server';
import { profile } from '@/content/profile';
import HeroBackground from '@/components/HeroBackground';
import HeroCanvas from '@/components/three/HeroCanvas';

export default async function HomeSections({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Home' });

  return (
    <>
      <section className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <HeroBackground />
        <HeroCanvas />
        <div className="relative flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-wide">{profile.name[lang]}</h1>
          <p className="text-lg opacity-90">{profile.tagline[lang]}</p>
          <p className="font-mono text-sm opacity-70">{profile.status[lang]}</p>
          <p className="max-w-xl text-sm opacity-60">{t('tagline')}</p>
          <a
            href="#about"
            className="mt-6 rounded-full border border-accent/60 px-6 py-2 text-sm text-accent transition-opacity hover:opacity-70"
          >
            {t('explore')}
          </a>
        </div>
        <div
          data-scroll-hint
          className="scroll-hint absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-1 text-xs opacity-70"
        >
          <span>{t('scrollHint')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>
      <section id="about" className="mx-auto min-h-[50vh] max-w-3xl px-6 py-24">
        <h2 className="text-2xl font-semibold">About</h2>
        <p className="mt-4 opacity-70">{t('aboutPlaceholder')}</p>
      </section>
    </>
  );
}