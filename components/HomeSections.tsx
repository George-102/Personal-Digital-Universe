import { getTranslations } from 'next-intl/server';
import { profile } from '@/content/profile';
import HeroBackground from '@/components/HeroBackground';

export default async function HomeSections({ lang }: { lang: 'zh' | 'en' }) {
  const t = await getTranslations({ locale: lang, namespace: 'Home' });

  return (
    <>
      <section className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <HeroBackground />
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
      </section>
      <section id="about" className="mx-auto min-h-[50vh] max-w-3xl px-6 py-24">
        <h2 className="text-2xl font-semibold">About</h2>
        <p className="mt-4 opacity-70">{t('aboutPlaceholder')}</p>
      </section>
    </>
  );
}