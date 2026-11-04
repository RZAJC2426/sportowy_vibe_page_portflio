import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import BookingCalendar from '@/components/feature/BookingCalendar';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import { usePageVisit } from '@/hooks/useLikes';

interface Partner {
  id: string;
  name: string;
  role_key: string;
  desc_key: string;
  image_url: string;
  website: string;
  display_order: number;
}

export default function WspolpracaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);

  usePageVisit('/o-nas/wspolpraca');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, role_key, desc_key, image_url, website, display_order')
        .order('display_order', { ascending: true });

      if (!error && data) {
        setPartners(data as Partner[]);
      }
      setPartnersLoading(false);
    };
    fetchPartners();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!consentEmail) {
      setConsentError(t('wspolpraca.consent_required'));
      return;
    }
    setConsentError('');

    setFormStatus('submitting');
    setFormError('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = (formData.get('company_alt') as string || '').trim();
    if (honeypot) {
      setFormStatus('success');
      form.reset();
      return;
    }

    const fields: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string' && key !== 'company_alt' && value.trim()) {
        fields[key] = value;
      }
    });

    try {
      const { data, error } = await supabase.functions.invoke('send-form-email', {
        body: { form_type: 'wspolpraca', fields },
      });
      if (error || !data?.success) {
        setFormStatus('error');
        setFormError(t('wspolpraca.form_error'));
        return;
      }
      setFormStatus('success');
      form.reset();
      setConsentEmail(false);
    } catch {
      setFormStatus('error');
      setFormError(t('wspolpraca.form_error'));
    }
  };

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Współpraca — Partnerzy i Kontakt | Sportowy Vibe',
            description: 'Nawiąż współpracę ze Sportowym Vibe. Poznaj naszych partnerów — Flashscore, Skocznia Strachoczanka, Klub Golfowy Jelenia Góra i inni. Umów się na rozmowę.',
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Hero background image */}
          <div className="absolute inset-0">
            <EditableImage
              contentKey="wspolpraca_hero_img"
              fallbackSrc=""
              alt=""
              className="h-full w-full object-cover object-top"
              containerClassName="h-full w-full"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-background-100 pointer-events-none" />
          </div>
          <div className="relative mx-auto max-w-[900px] px-4 md:px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600 mb-4">
              <EditableImage contentKey="wspolpraca_icon_hero" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                <i className="ri-service-line"></i>
              </EditableImage>
              <EditableText contentKey="wspolpraca_hero_badge" fallback={t('wspolpraca.hero_badge')} />
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
              <EditableColor contentKey="color_wspolpraca_hero_title" fallbackColor="#0F172A">
                <EditableText contentKey="wspolpraca_hero_title" fallback={t('wspolpraca.hero_title')} shadowKey="shadow_wspolpraca_hero_h1" shadowFallback="0 2px 10px rgba(0,0,0,0.45)" />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-foreground-600">
              <EditableColor contentKey="color_wspolpraca_hero_desc" fallbackColor="#475569">
                <EditableText contentKey="wspolpraca_hero_desc" fallback={t('wspolpraca.hero_desc')} as="span" shadowKey="shadow_wspolpraca_hero_p" shadowFallback="0 2px 8px rgba(0,0,0,0.32)" />
              </EditableColor>
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link to="/o-nas/tworcy" className="inline-flex items-center gap-2 rounded-full border border-foreground-300 px-5 py-2.5 text-sm font-semibold text-foreground-700 transition-all hover:bg-background-200 whitespace-nowrap cursor-pointer active:bg-primary-100/50">
                <EditableImage contentKey="wspolpraca_icon_tab_creators" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-team-line text-sm"></i>
                </EditableImage>
                {t('wspolpraca.tab_creators')}
              </Link>
              <Link to="/o-nas/historia" className="inline-flex items-center gap-2 rounded-full border border-foreground-300 px-5 py-2.5 text-sm font-semibold text-foreground-700 transition-all hover:bg-background-200 whitespace-nowrap cursor-pointer active:bg-primary-100/50">
                <EditableImage contentKey="wspolpraca_icon_tab_history" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-road-map-line text-sm"></i>
                </EditableImage>
                {t('wspolpraca.tab_history')}
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap cursor-default">
                <EditableImage contentKey="wspolpraca_icon_tab_cooperation" fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                  <i className="ri-service-line text-sm"></i>
                </EditableImage>
                {t('wspolpraca.tab_cooperation')}
              </span>
            </div>
          </div>
        </section>

        {/* Partners Grid */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 tracking-tight">
                <EditableColor contentKey="color_wspolpraca_partners_title" fallbackColor="#0F172A">
                  <EditableText contentKey="wspolpraca_partners_title" fallback={t('wspolpraca.partners_title')} />
                </EditableColor>
              </h2>
              <p className="mt-2 text-sm text-foreground-600">
                <EditableColor contentKey="color_wspolpraca_partners_desc" fallbackColor="#475569">
                  <EditableText contentKey="wspolpraca_partners_desc" fallback={t('wspolpraca.partners_desc')} as="span" />
                </EditableColor>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnersLoading ? (
                <div className="col-span-full text-center py-10">
                  <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-background-100 text-accent-500 animate-spin">
                    <i className="ri-loader-4-line text-xl"></i>
                  </span>
                  <p className="mt-2 text-sm text-foreground-500">{t('admin.loading')}</p>
                </div>
              ) : partners.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <p className="text-sm text-foreground-500">{t('admin.partner_empty')}</p>
                </div>
              ) : (
                partners.map((p) => (
                <a
                  key={p.id}
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-xl border border-background-200/80 bg-background-50 overflow-hidden transition-all duration-300 hover:border-accent-300/60 hover:shadow-lg hover:shadow-accent-500/5 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex h-48 items-center justify-center bg-background-50 p-6">
                    <EditableImage
                      contentKey={`wspolpraca_partner_img_${p.id}`}
                      fallbackSrc={p.image_url}
                      alt={p.name}
                      className="h-auto w-auto max-h-[160px] max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col flex-1 p-5">
                    <span className="inline-flex self-start rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-[11px] font-semibold text-accent-600 mb-2">
                      {t(p.role_key)}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground-900">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground-600 flex-1">
                      {t(p.desc_key)}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-600 group-hover:text-accent-700 transition-colors">
                      <span>{t('wspolpraca.partner_visit')}</span>
                      <i className="ri-arrow-right-up-line text-xs"></i>
                    </div>
                  </div>
                </a>
              )))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-10 bg-background-100">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <div className="rounded-xl border border-accent-200/70 bg-background-50 p-8 md:p-10 text-center">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 tracking-tight">
                <EditableColor contentKey="color_wspolpraca_cta_title" fallbackColor="#0F172A">
                  <EditableText contentKey="wspolpraca_cta_title" fallback={t('wspolpraca.cta_title')} />
                </EditableColor>
              </h2>
              <p className="mt-3 max-w-lg mx-auto text-sm md:text-base text-foreground-600">
                <EditableColor contentKey="color_wspolpraca_cta_desc" fallbackColor="#475569">
                  <EditableText contentKey="wspolpraca_cta_desc" fallback={t('wspolpraca.cta_desc')} as="span" />
                </EditableColor>
              </p>
            </div>
          </div>
        </section>

        {/* Booking Calendar */}
        <section id="rezerwacja" className="py-14 md:py-20">
          <div className="mx-auto max-w-[720px] px-4 md:px-6">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-300/50 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600 mb-4">
                <EditableImage contentKey="wspolpraca_icon_booking" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                  <i className="ri-calendar-event-line"></i>
                </EditableImage>
                <EditableColor contentKey="color_wspolpraca_booking_title" fallbackColor="#0EA5E9">
                  <EditableText contentKey="wspolpraca_booking_section_badge" fallback={t('booking.section_badge')} />
                </EditableColor>
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 tracking-tight">
                <EditableText contentKey="wspolpraca_booking_title" fallback={t('booking.section_title')} />
              </h2>
              <p className="mt-2 text-sm text-foreground-600">
                <EditableColor contentKey="color_wspolpraca_booking_desc" fallbackColor="#475569">
                  <EditableText contentKey="wspolpraca_booking_desc" fallback={t('booking.section_desc')} as="span" />
                </EditableColor>
              </p>
            </div>

            <div className="rounded-xl border border-background-200/80 bg-background-50 p-6 md:p-8">
              <BookingCalendar
                timeslotsApi="https://readdy.ai/api/public/calendar/timeslots/6b577641-b4ea-4107-bb56-5f8fbbf97e07.dc662c14cacbf4e3ac3c1072840fa0d6f08b65408422ffe90671f5a6a4267a28"
                appointmentsApi="https://readdy.ai/api/public/calendar/appointments/6b577641-b4ea-4107-bb56-5f8fbbf97e07.dc662c14cacbf4e3ac3c1072840fa0d6f08b65408422ffe90671f5a6a4267a28"
                texts={{
                  stepDateTitle: t('booking.step_date_title'),
                  stepDateDesc: t('booking.step_date_desc'),
                  stepTimeTitle: t('booking.step_time_title'),
                  stepTimeDesc: t('booking.step_time_desc'),
                  stepFormTitle: t('booking.step_form_title'),
                  stepFormDesc: t('booking.step_form_desc'),
                  monthPrev: t('booking.month_prev'),
                  monthNext: t('booking.month_next'),
                  selectDate: t('booking.select_date'),
                  selectTime: t('booking.select_time'),
                  noSlots: t('booking.no_slots'),
                  loading: t('booking.loading'),
                  reviewTitle: t('booking.review_title'),
                  reviewDate: t('booking.review_date'),
                  reviewStart: t('booking.review_start'),
                  reviewEnd: t('booking.review_end'),
                  modifyTime: t('booking.modify_time'),
                  labelName: t('booking.label_name'),
                  placeholderName: t('booking.placeholder_name'),
                  labelPhone: t('booking.label_phone'),
                  placeholderPhone: t('booking.placeholder_phone'),
                  labelNotes: t('booking.label_notes'),
                  placeholderNotes: t('booking.placeholder_notes'),
                  submit: t('booking.submit'),
                  submitting: t('booking.submitting'),
                  successTitle: t('booking.success_title'),
                  successDesc: t('booking.success_desc'),
                  errorGeneric: t('booking.error_generic'),
                  errorFetch: t('booking.error_fetch'),
                  required: t('booking.required'),
                }}
              />
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="formularz" className="py-14 md:py-20">
          <div className="mx-auto max-w-[720px] px-4 md:px-6">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 mb-4">
                <EditableImage contentKey="wspolpraca_icon_form" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                  <i className="ri-mail-send-line"></i>
                </EditableImage>
                <EditableColor contentKey="color_wspolpraca_form_title" fallbackColor="#2563eb">
                  <EditableText contentKey="wspolpraca_form_badge" fallback={t('wspolpraca.form_badge')} />
                </EditableColor>
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 tracking-tight">
                <EditableText contentKey="wspolpraca_form_title" fallback={t('wspolpraca.form_title')} />
              </h2>
              <p className="mt-2 text-sm text-foreground-600">
                <EditableColor contentKey="color_wspolpraca_form_desc" fallbackColor="#475569">
                  <EditableText contentKey="wspolpraca_form_desc" fallback={t('wspolpraca.form_desc')} as="span" />
                </EditableColor>
              </p>
            </div>

            <form
              data-readdy-form
              id="wspolpraca-contact-form"
              onSubmit={handleSubmit}
              className="rounded-xl border border-background-200/80 bg-background-50 p-6 md:p-8 space-y-5"
            >
              <input
                type="text"
                name="company_alt"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="form-honeypot"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block mb-1.5 text-sm font-semibold text-foreground-800">
                    {t('wspolpraca.form_name_label')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder={t('wspolpraca.form_name_placeholder')}
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block mb-1.5 text-sm font-semibold text-foreground-800">
                    {t('wspolpraca.form_email_label')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={t('wspolpraca.form_email_placeholder')}
                    className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organization" className="block mb-1.5 text-sm font-semibold text-foreground-800">
                  {t('wspolpraca.form_org_label')}
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder={t('wspolpraca.form_org_placeholder')}
                  className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                />
              </div>

              <div>
                <label htmlFor="message" className="block mb-1.5 text-sm font-semibold text-foreground-800">
                  {t('wspolpraca.form_message_label')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={500}
                  rows={5}
                  placeholder={t('wspolpraca.form_message_placeholder')}
                  className="w-full rounded-md border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 resize-none"
                ></textarea>
                <p className="mt-1 text-xs text-foreground-400">{t('wspolpraca.form_char_limit')}</p>
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
                  <span className="text-sm text-foreground-700">{t('wspolpraca.consent_email')}</span>
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
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500 mt-0.5">
                  <i className="ri-shield-user-line text-xs"></i>
                </span>
                <p className="text-xs text-foreground-600 leading-relaxed">
                  <EditableText contentKey="wspolpraca_ado_info" fallback={t('wspolpraca.ado_info')} as="span" />
                </p>
              </div>

              {consentError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                  <i className="ri-error-warning-line text-sm"></i>
                  {consentError}
                </div>
              )}

              {formStatus === 'success' ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-base"></i>
                  {t('wspolpraca.form_success')}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-sm"></i>
                      {t('wspolpraca.form_sending')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-fill text-sm"></i>
                      {t('wspolpraca.form_send')}
                    </>
                  )}
                </button>
              )}

              {formStatus === 'error' && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 flex items-center gap-2">
                  <i className="ri-error-warning-fill text-base"></i>
                  {formError}
                </div>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-background-200/70 bg-background-100">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
              <EditableImage
                contentKey="site_logo_footer"
                fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
                alt="Sportowy VIBE"
                className="h-8 w-auto max-w-[130px] object-contain"
              />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Strona główna
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/nasze-filmy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Filmy
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/o-nas/tworcy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                O nas
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <button
                type="button"
                onClick={() => { navigate('/'); setTimeout(() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' }), 300); }}
                className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Kontakt
              </button>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/o-nas/wspolpraca" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">
                Współpraca
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/polityka-prywatnosci" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Polityka prywatności
              </Link>
              <span className="text-foreground-300 text-xs select-none">|</span>
              <Link to="/regulamin-serwisu" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
                Regulamin Serwisu
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <a href="https://www.youtube.com/@sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="YouTube">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-youtube-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.facebook.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Facebook">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-facebook-fill text-lg"></i>
                </span>
              </a>
              <a href="https://www.instagram.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Instagram">
                <span className="flex h-8 w-8 items-center justify-center">
                  <i className="ri-instagram-line text-lg"></i>
                </span>
              </a>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-background-200/70 text-center">
            <p className="text-xs text-foreground-400">
              {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}