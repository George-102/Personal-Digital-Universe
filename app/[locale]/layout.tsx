import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { profile } from '@/content/profile';

export function generateStaticParams() {
  // 中文由根路由 / 承载，这里只预生成英文，避免 /zh 与 / 内容重复
  return [{ locale: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === 'zh' ? 'zh' : 'en';
  const title = `${profile.name[lang]} — Personal Digital Universe`;
  return {
    title,
    description: `${profile.tagline[lang]} ${profile.status[lang]}`,
    openGraph: {
      title,
      description: profile.tagline[lang],
      type: 'profile',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}