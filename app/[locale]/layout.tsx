import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import '../globals.css';

export function generateStaticParams() {
  // 中文由根路由 / 承载，这里只预生成英文，避免 /zh 与 / 内容重复
  return [{ locale: 'en' }];
}

export const metadata: Metadata = {
  title: 'Personal Digital Universe',
  description: '3D 沉浸式个人数字空间',
};

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