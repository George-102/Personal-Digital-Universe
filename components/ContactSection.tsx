import { getTranslations } from 'next-intl/server';
import { contact, profile } from '@/content/index';
import { isValidEmail, mailtoHref, publicContactLinks } from '@/lib/contact';
import CopyEmailButton from '@/components/CopyEmailButton';
import ContactCanvas from '@/components/ContactCanvas';

type Props = {
  lang: 'zh' | 'en';
  /** 独立 /contact 页面用 h1；首页 section 用 h2（全页仍只有一个 h1） */
  standalone?: boolean;
};

/**
 * US-018c：Contact 信息主体。服务端渲染，邮箱 / 链接 / 合作方向全部进入静态 HTML，
 * 无 JS 与无 WebGL 时完整可读（PRD §6.6 / 验收 1）。3D 只是旁边的视觉层（US-018f）。
 */
export default async function ContactSection({ lang, standalone = false }: Props) {
  const t = await getTranslations({ locale: lang, namespace: 'Contact' });
  const email = contact?.email ?? profile.email ?? '';
  const hasEmail = isValidEmail(email);
  const links = publicContactLinks(contact?.links ?? []);
  const collaborations = contact?.collaborations ?? [];
  const Heading = standalone ? 'h1' : 'h2';

  return (
    <section
      id="contact"
      data-contact-section
      className="contact-section mx-auto w-full max-w-5xl scroll-mt-24 px-6 py-24"
    >
      <div className="contact-layout">
        <div className="contact-panel" data-contact-panel>
          <p className="text-xs tracking-[0.3em] text-accent/80">{t('eyebrow')}</p>
          <Heading className="mt-3 text-2xl font-semibold sm:text-3xl">{t('title')}</Heading>
          <p className="contact-intro mt-4 max-w-2xl text-[15px] leading-7">{t('intro')}</p>

          {hasEmail && (
            <div className="contact-email-block mt-8">
              <p className="contact-label">{t('emailLabel')}</p>
              <div className="contact-email-row mt-2">
                <a
                  id="contact-email"
                  data-contact-email
                  href={mailtoHref(email)}
                  className="contact-email-link"
                >
                  {email}
                </a>
                <CopyEmailButton
                  email={email}
                  labels={{
                    copy: t('copy'),
                    copied: t('copied'),
                    copyFailed: t('copyFailed'),
                    copyUnavailable: t('copyUnavailable'),
                  }}
                />
              </div>
              <a
                data-contact-mailto
                href={mailtoHref(email)}
                className="contact-action mt-3"
              >
                {t('mailtoLabel')}
              </a>
            </div>
          )}

          {links.length > 0 && (
            <div className="mt-8">
              <p className="contact-label">{t('linksLabel')}</p>
              <ul className="contact-links mt-3">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-contact-link
                      data-contact-kind={link.kind}
                      className="contact-action"
                    >
                      {link.label[lang]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {collaborations.length > 0 && (
            <div className="mt-8">
              <p className="contact-label">{t('collaborationsLabel')}</p>
              <ul data-contact-collaborations className="contact-collaborations mt-3">
                {collaborations.map((item, index) => (
                  <li key={index} data-contact-collaboration>
                    {item[lang]}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* US-018f：3D 空间场景挂载于此，纯视觉层、aria-hidden、可完全缺席 */}
        <div className="contact-visual" aria-hidden="true" data-contact-visual>
          <ContactCanvas />
        </div>
      </div>
    </section>
  );
}
