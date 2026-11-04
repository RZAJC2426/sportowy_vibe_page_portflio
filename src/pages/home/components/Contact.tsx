import { useState, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '@/lib/supabase';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import EditableIcon from '@/components/feature/EditableIcon';

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [charCount, setCharCount] = useState(0);
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentError, setConsentError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!consentEmail) {
      setConsentError(t('contact.consent_required'));
      return;
    }
    setConsentError('');

    setFormStatus('submitting');
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    const honeypot = (formData.get('website_alt') as string || '').trim();
    if (honeypot) {
      // Bot detected - fake success, send nothing
      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 3000);
      return;
    }

    const fields: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string' && key !== 'website_alt' && value.trim()) {
        fields[key] = value;
      }
    });

    try {
      const { data, error } = await supabase.functions.invoke('send-form-email', {
        body: { form_type: 'contact', fields },
      });
      if (error || !data?.success) {
        setFormStatus('error');
        return;
      }
      setFormStatus('success');
    } catch {
      setFormStatus('error');
    }
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current?.querySelectorAll('[data-anim]') ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="kontakt" ref={sectionRef} className="relative py-14 md:py-20 bg-background-100">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mb-10 md:mb-14 text-center">
          <span data-anim className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
            <EditableIcon contentKey="home_icon_contact_badge" fallbackIcon="ri-mail-send-line" className="text-primary-500" />
            <EditableColor contentKey="color_home_contact_badge" fallbackColor="#14B8A6">
              <EditableText contentKey="home_contact_badge" fallback={t('contact.badge')} />
            </EditableColor>
          </span>
          <h2 data-anim className="mt-4 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight">
            <EditableColor contentKey="color_home_contact_title" fallbackColor="#0F172A">
              <EditableText contentKey="home_contact_title" fallback={t('contact.title')} />
            </EditableColor>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div data-anim className="space-y-6">
            <h3 className="font-heading text-xl font-semibold text-foreground-900">
              <EditableColor contentKey="color_contact_methods_title" fallbackColor="#0F172A">
                <EditableText contentKey="contact_methods_title" fallback={t('contact.methods_title')} />
              </EditableColor>
            </h3>
            <div className="space-y-4">
              <div data-anim className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50">
                  <EditableIcon contentKey="home_icon_contact_business" fallbackIcon="ri-briefcase-line" className="text-primary-500 text-lg" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground-800">{t('contact.business_label')}</p>
                  <a
                    href="mailto:biznes@sportowyvibe.pl"
                    className="mt-0.5 text-sm text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    biznes@sportowyvibe.pl
                  </a>
                </div>
              </div>
              <div data-anim className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50">
                  <EditableIcon contentKey="home_icon_contact_tech" fallbackIcon="ri-tools-line" className="text-primary-500 text-lg" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground-800">{t('contact.tech_label')}</p>
                  <a
                    href="mailto:kontakt@sportowyvibe.pl"
                    className="mt-0.5 text-sm text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    kontakt@sportowyvibe.pl
                  </a>
                </div>
              </div>
            </div>

            {/* AI Chat Assistant */}
            <div data-anim className="rounded-lg border border-accent-200/60 bg-accent-50/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-100">
                  <EditableIcon contentKey="home_icon_contact_ai" fallbackIcon="ri-robot-2-line" className="text-accent-600 text-lg" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground-800">{t('contact.ai_title')}</p>
                </div>
              </div>
              <p className="text-sm text-foreground-500 mb-3">
                {t('contact.ai_desc')}
              </p>
              <button
                type="button"
                onClick={() => {
                  const btn = document.querySelector('#vapi-widget-floating-button');
                  if (btn) (btn as HTMLElement).click();
                }}
                className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-600 whitespace-nowrap"
              >
                <EditableIcon contentKey="home_icon_contact_ai_cta" fallbackIcon="ri-chat-3-line" className="text-white text-sm" />
                {t('contact.ai_cta')}
              </button>
            </div>

            <div data-anim className="pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-400">
                {t('contact.social_label')}
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.youtube.com/@Sportowy_Vibe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-200 transition-all hover:bg-primary-50"
                  aria-label="YouTube Sportowy VIBE"
                >
                  <EditableIcon contentKey="home_icon_contact_social_yt" fallbackIcon="ri-youtube-line" className="text-foreground-400 group-hover:text-red-500 text-xl transition-colors" />
                </a>
                <a
                  href="https://www.facebook.com/SportowyVIBE/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-200 transition-all hover:bg-primary-50"
                  aria-label="Facebook Sportowy VIBE"
                >
                  <EditableIcon contentKey="home_icon_contact_social_fb" fallbackIcon="ri-facebook-fill" className="text-foreground-400 group-hover:text-blue-600 text-xl transition-colors" />
                </a>
                <a
                  href="https://www.twitch.tv/SportowyVIBE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-200 transition-all hover:bg-primary-50"
                  aria-label="Twitch Sportowy VIBE"
                >
                  <EditableIcon contentKey="home_icon_contact_social_twitch" fallbackIcon="ri-twitch-line" className="text-foreground-400 group-hover:text-purple-500 text-xl transition-colors" />
                </a>
              </div>
              <p className="mt-3 text-sm text-foreground-500">/SportowyVIBE</p>
            </div>
          </div>

          <div data-anim className="rounded-lg border border-background-200/70 bg-background-50 p-6 md:p-8">
            {formStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-4">
                  <i className="ri-check-line text-3xl text-primary-500"></i>
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground-900 mb-2">
                  <EditableColor contentKey="color_contact_success_title" fallbackColor="#0F172A">
                    <EditableText contentKey="contact_success_title" fallback={t('contact.form_success_title')} />
                  </EditableColor>
                </h3>
                <p className="text-sm text-foreground-500">
                  {t('contact.form_success_text')}
                </p>
              </div>
            ) : (
              <form
                data-readdy-form="contact-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    {t('contact.form_name_label')}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    required
                    className="w-full rounded-md border border-background-200 bg-background-100 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('contact.form_name_placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    {t('contact.form_email_label')}
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-md border border-background-200 bg-background-100 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('contact.form_email_placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    {t('contact.form_subject_label')}
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    className="w-full rounded-md border border-background-200 bg-background-100 px-3 py-2.5 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30 appearance-none cursor-pointer"
                  >
                    <option value="">Wybierz temat</option>
                    <option value="Propozycja współpracy">{t('contact.form_subject_option_1')}</option>
                    <option value="Pomysł na program">{t('contact.form_subject_option_2')}</option>
                    <option value="Problem techniczny">{t('contact.form_subject_option_3')}</option>
                  </select>
                  <input
                    id="contact-subject-custom"
                    name="subject_custom"
                    type="text"
                    placeholder="lub napisz własny temat..."
                    className="mt-2 w-full rounded-md border border-background-200 bg-background-100 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    {t('contact.form_message_label')}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    maxLength={500}
                    rows={5}
                    onChange={(e) => setCharCount(e.target.value.length)}
                    className="w-full resize-none rounded-md border border-background-200 bg-background-100 px-3 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('contact.form_message_placeholder')}
                  />
                  <p className="mt-1 text-right text-xs text-foreground-400">
                    {charCount}/500
                  </p>
                </div>

                {/* Consent checkbox */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consent_email"
                      checked={consentEmail}
                      onChange={(e) => { setConsentEmail(e.target.checked); setConsentError(''); }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/30"
                    />
                    <span className="text-sm text-foreground-700">{t('contact.consent_email')}</span>
                  </label>
                </div>

                {/* Legal links */}
                <p className="text-xs text-foreground-500">
                  Zapoznaj się z{' '}
                  <Link to="/regulamin-serwisu" className="text-primary-500 hover:text-primary-600 underline">regulaminem serwisu</Link>
                  {' '}i{' '}
                  <Link to="/polityka-prywatnosci" className="text-primary-500 hover:text-primary-600 underline">polityką prywatności</Link>
                </p>

                {/* ADO info */}
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 mt-0.5">
                    <EditableIcon
                      contentKey="home_icon_contact_consent_shield"
                      fallbackIcon="ri-shield-user-line"
                      className="text-primary-500 text-xs"
                    />
                  </span>
                  <p className="text-xs text-foreground-600 leading-relaxed">
                    <EditableText contentKey="contact_ado_info" fallback={t('contact.ado_info')} as="span" />
                  </p>
                </div>

                {consentError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                    <i className="ri-error-warning-line text-sm"></i>
                    {consentError}
                  </div>
                )}

                {/* Honeypot */}
                <input
                  type="text"
                  name="website_alt"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="form-honeypot"
                />

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <EditableIcon contentKey="home_icon_contact_submit" fallbackIcon="ri-send-plane-line" className="text-white text-base" />
                  {formStatus === 'submitting' ? t('contact.form_sending') : t('contact.form_send')}
                </button>
                {formStatus === 'error' && (
                  <p className="text-sm text-red-500 text-center">
                    {t('contact.form_error')}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}