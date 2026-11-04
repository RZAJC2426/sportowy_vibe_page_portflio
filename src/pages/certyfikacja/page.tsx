import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';
import EditableImage from '@/components/feature/EditableImage';
import Certificate3D from '@/components/feature/Certificate3D';
import Breadcrumbs from '@/components/feature/Breadcrumbs';

const STEP_ICONS = [
  'ri-file-list-3-line',
  'ri-search-eye-line',
  'ri-building-2-line',
  'ri-article-line',
  'ri-tools-line',
  'ri-check-double-line',
  'ri-medal-line',
];

const BENEFIT_ICONS = [
  'ri-global-line',
  'ri-funds-box-line',
  'ri-bar-chart-grouped-line',
  'ri-shield-star-line',
  'ri-smartphone-line',
  'ri-heart-pulse-line',
];

const CERT_SVG_URL = 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/2b55db67-77b9-4e27-9f52-71dae827bcde_Certyfikat_Sport_Bez_Barier_Logos_Final.svg';

export default function CertyfikacjaPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Certyfikacja — Sport Bez Barier | Sportowy Vibe',
            description: 'Uzyskaj certyfikat dostępności obiektu sportowego Sport Bez Barier. Profesjonalny audyt dostępności, wsparcie ekspertów i oficjalny certyfikat dla Twojego obiektu sportowego.',
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs sticky />

      {/* Sub-navigation anchors */}
      <div className="sticky top-[64px] z-30 bg-background-50/95 backdrop-blur-md border-b border-background-200/70">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
          <a
            href="#proces"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground-600 hover:bg-primary-50 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <i className="ri-route-line text-xs"></i>
            <EditableText contentKey="cert_nav_process" fallback="Proces" />
          </a>
          <a
            href="#korzysci"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground-600 hover:bg-primary-50 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <i className="ri-star-line text-xs"></i>
            <EditableText contentKey="cert_nav_benefits" fallback="Korzyści" />
          </a>
          <a
            href="#faq"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-foreground-600 hover:bg-primary-50 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <i className="ri-question-answer-line text-xs"></i>
            <EditableText contentKey="cert_nav_faq" fallback="FAQ" />
          </a>
          <a
            href="#zgloszenie"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <i className="ri-send-plane-line text-xs"></i>
            <EditableText contentKey="cert_nav_submit" fallback="Zgłoszenie" />
          </a>
        </div>
      </div>

      <HeroSection />
      <ProcessSection />
      <BenefitsSection />
      <FAQSection />
      <CTAFormSection />

      {/* ======== FOOTER ======== */}
      <footer className="border-t border-background-200/70 bg-background-100">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
              <EditableImage
                contentKey="site_logo_nav"
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
              <Link to="/o-nas/wspolpraca" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">
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
              <EditableText contentKey="cert_footer_rights" fallback={t('cert.footer_rights')} as="span" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───── 3D CERTIFICATE HERO ───── */
function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-6 pb-16 md:pt-10 md:pb-24 bg-background-50">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, oklch(var(--primary-500)) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          <div className="w-full lg:w-[55%] text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600 tracking-wide uppercase mb-6">
              <EditableImage contentKey="cert_icon_hero" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                <i className="ri-medal-line"></i>
              </EditableImage>
              <EditableText contentKey="cert_hero_badge" fallback={t('cert.hero_badge')} />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground-950 tracking-tight leading-[1.02]">
              <EditableColor contentKey="color_cert_hero_title_line1" fallbackColor="#0F172A">
                <EditableText contentKey="cert_hero_title_line1" fallback={t('cert.hero_title_line1')} />
              </EditableColor>
              <br />
              <span className="text-primary-600">
                <EditableColor contentKey="color_cert_hero_title_line2" fallbackColor="#14B8A6">
                  <EditableText contentKey="cert_hero_title_line2" fallback={t('cert.hero_title_line2')} />
                </EditableColor>
              </span>
            </h1>
            <p className="mt-5 max-w-[540px] mx-auto lg:mx-0 text-base leading-relaxed text-foreground-500">
              <EditableColor contentKey="color_cert_hero_desc" fallbackColor="#64748B">
                <EditableText contentKey="cert_hero_desc" fallback={t('cert.hero_desc')} as="span" />
              </EditableColor>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <a
                href="#zgloszenie"
                className="cursor-pointer inline-flex items-center gap-2.5 rounded-lg bg-primary-500 px-7 py-3.5 text-base font-bold text-white transition-all hover:bg-primary-600 whitespace-nowrap"
              >
                <EditableText contentKey="cert_hero_cta_start" fallback={t('cert.hero_cta_start')} />
                <i className="ri-arrow-right-line"></i>
              </a>
              <a
                href="#proces"
                className="cursor-pointer inline-flex items-center gap-2.5 rounded-lg border border-primary-300 px-7 py-3.5 text-base font-semibold text-primary-600 transition-all hover:border-primary-400 hover:bg-primary-50 whitespace-nowrap"
              >
                <i className="ri-information-line"></i>
                <EditableText contentKey="cert_hero_cta_how" fallback={t('cert.hero_cta_how')} />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5 justify-center lg:justify-start text-foreground-500">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 border border-primary-200">
                  <i className="ri-funds-line text-primary-500 text-sm"></i>
                </div>
                <span className="text-xs font-medium"><EditableText contentKey="cert_hero_info_1" fallback={t('cert.hero_info_1')} /></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 border border-primary-200">
                  <i className="ri-global-line text-primary-500 text-sm"></i>
                </div>
                <span className="text-xs font-medium"><EditableText contentKey="cert_hero_info_2" fallback={t('cert.hero_info_2')} /></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 border border-primary-200">
                  <i className="ri-time-line text-primary-500 text-sm"></i>
                </div>
                <span className="text-xs font-medium"><EditableText contentKey="cert_hero_info_3" fallback={t('cert.hero_info_3')} /></span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[45%]">
            <Certificate3D
              imageSrc={CERT_SVG_URL}
              alt="Certyfikat Obiekt Dostępny — Sport Bez Barier"
              contentKey="cert_hero_certificate"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───── PROCESS TIMELINE ───── */
function ProcessSection() {
  const { t } = useTranslation();

  return (
    <section id="proces" className="relative py-14 md:py-20 bg-background-100">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/15 to-transparent" />

      <div className="mx-auto max-w-[1100px] px-4 md:px-6">
        <div className="mb-12 md:mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600 tracking-wide uppercase">
            <EditableImage contentKey="cert_icon_process" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
              <i className="ri-route-line"></i>
            </EditableImage>
            <EditableText contentKey="cert_process_badge" fallback={t('cert.process_badge')} />
          </span>
          <h2 className="mt-5 font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
            <EditableColor contentKey="color_cert_process_title" fallbackColor="#0F172A">
              <EditableText contentKey="cert_process_title" fallback={t('cert.process_title')} />
            </EditableColor>
          </h2>
          <p className="mx-auto mt-3 max-w-[600px] text-base text-foreground-500 leading-relaxed">
            <EditableText contentKey="cert_process_desc" fallback={t('cert.process_desc')} as="span" />
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-[39px] md:left-[47px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary-500/30 via-primary-500/15 to-primary-500/5 hidden md:block" />

          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6, 7].map((num, idx) => {
              const stepNum = String(num).padStart(2, '0');
              const icon = STEP_ICONS[idx];
              return (
                <div key={stepNum} className="relative pb-8 md:pb-10 last:pb-0">
                  <div className="flex gap-4 md:gap-6">
                    <div className="relative z-10 flex shrink-0 flex-col items-center">
                      <div className="flex h-[68px] w-[68px] md:h-[78px] md:w-[78px] items-center justify-center rounded-2xl bg-background-50 border-2 border-primary-300/50 group transition-all duration-300 shadow-sm">
                        <span className="font-heading text-2xl md:text-3xl font-bold text-primary-600">
                          {stepNum}
                        </span>
                      </div>
                      {idx < 6 && (
                        <div className="md:hidden w-[2px] flex-1 bg-primary-500/15 mt-2 h-6" />
                      )}
                    </div>

                    <div className="flex-1 pt-1.5 md:pt-2">
                      <div className="rounded-xl border border-background-200/70 bg-background-50 p-5 md:p-6 hover:border-primary-300/50 transition-all duration-300 shadow-sm">
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 border border-primary-200">
                            <EditableImage contentKey={`cert_icon_step_${num}`} fallbackSrc="" alt="" className="h-4 w-4 object-contain">
                              <i className={`${icon} text-primary-500 text-base`}></i>
                            </EditableImage>
                          </span>
                          <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground-900">
                            <EditableText contentKey={`cert_step_${num}_title`} fallback={t(`cert.step_${num}_title`)} />
                          </h3>
                        </div>
                        <p className="text-sm md:text-base leading-relaxed text-foreground-500">
                          <EditableText contentKey={`cert_step_${num}_desc`} fallback={t(`cert.step_${num}_desc`)} as="span" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───── BENEFITS ───── */
function BenefitsSection() {
  const { t } = useTranslation();

  return (
    <section id="korzysci" className="relative py-14 md:py-20 bg-background-50">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/15 to-transparent" />

      <div className="mx-auto max-w-[1100px] px-4 md:px-6">
        <div className="mb-12 md:mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600 tracking-wide uppercase">
            <EditableImage contentKey="cert_icon_benefits" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
              <i className="ri-star-line"></i>
            </EditableImage>
            <EditableText contentKey="cert_benefits_badge" fallback={t('cert.benefits_badge')} />
          </span>
          <h2 className="mt-5 font-heading text-3xl md:text-5xl font-bold text-foreground-950 tracking-tight">
            <EditableColor contentKey="color_cert_benefits_title" fallbackColor="#0F172A">
              <EditableText contentKey="cert_benefits_title" fallback={t('cert.benefits_title')} />
            </EditableColor>
          </h2>
          <p className="mx-auto mt-3 max-w-[600px] text-base text-foreground-500 leading-relaxed">
            <EditableText contentKey="cert_benefits_desc" fallback={t('cert.benefits_desc')} as="span" />
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div
              key={num}
              className="group rounded-xl border border-background-200/70 bg-background-50 p-6 md:p-7 transition-all duration-300 hover:border-primary-300/50 hover:-translate-y-1 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 border border-primary-200 mb-5 group-hover:bg-primary-100 transition-colors">
                <EditableImage contentKey={`cert_icon_benefit_${num}`} fallbackSrc="" alt="" className="h-5 w-5 object-contain">
                  <i className={`${BENEFIT_ICONS[num - 1]} text-primary-500 text-xl`}></i>
                </EditableImage>
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-2">
                <EditableText contentKey={`cert_benefit_${num}_title`} fallback={t(`cert.benefit_${num}_title`)} />
              </h3>
              <p className="text-sm leading-relaxed text-foreground-500">
                <EditableText contentKey={`cert_benefit_${num}_desc`} fallback={t(`cert.benefit_${num}_desc`)} as="span" />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── FAQ ───── */
function FAQSection() {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => setOpenIdx(openIdx === idx ? null : idx);

  return (
    <section id="faq" className="relative py-14 md:py-20 bg-background-100">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/15 to-transparent" />

      <div className="mx-auto max-w-[800px] px-4 md:px-6">
        <div className="mb-12 md:mb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600 tracking-wide uppercase">
            <EditableImage contentKey="cert_icon_faq" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
              <i className="ri-question-answer-line"></i>
            </EditableImage>
            <EditableText contentKey="cert_faq_badge" fallback={t('cert.faq_badge')} />
          </span>
          <h2 className="mt-5 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight">
            <EditableColor contentKey="color_cert_faq_title" fallbackColor="#0F172A">
              <EditableText contentKey="cert_faq_title" fallback={t('cert.faq_title')} />
            </EditableColor>
          </h2>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((num, idx) => (
            <div
              key={num}
              className="rounded-xl border border-background-200/70 bg-background-50 overflow-hidden transition-all duration-300 hover:border-primary-300/50 shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer"
              >
                <span className="text-sm md:text-base font-semibold text-foreground-900 pr-4">
                  <EditableText contentKey={`cert_faq_${num}_q`} fallback={t(`cert.faq_${num}_q`)} />
                </span>
                <span
                  className="flex shrink-0 h-7 w-7 items-center justify-center rounded-full border border-primary-300 text-primary-500 transition-transform duration-300"
                  style={{ transform: openIdx === idx ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  <i className="ri-add-line text-sm"></i>
                </span>
              </button>
              <div
                className="transition-all duration-300 overflow-hidden"
                style={{
                  maxHeight: openIdx === idx ? '500px' : '0px',
                  opacity: openIdx === idx ? 1 : 0,
                }}
              >
                <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                  <p className="text-sm leading-relaxed text-foreground-500">
                    <EditableText contentKey={`cert_faq_${num}_a`} fallback={t(`cert.faq_${num}_a`)} as="span" />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── CTA + FORM ───── */
function CTAFormSection() {
  const { t } = useTranslation();
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [charCount, setCharCount] = useState(0);
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentPhone, setConsentPhone] = useState(false);
  const [consentError, setConsentError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!consentEmail) {
      setConsentError(t('cert.consent_required', { defaultValue: 'Musisz wyrazić zgodę na przetwarzanie danych osobowych, aby wysłać formularz.' }));
      return;
    }
    setConsentError('');

    const form = e.currentTarget;

    // Honeypot check
    const honeypotEl = form.querySelector<HTMLInputElement>('[name="phone_alt"]');
    if (honeypotEl && honeypotEl.value.trim()) {
      setFormStatus('success');
      return;
    }

    setFormStatus('submitting');
    const formData = new FormData(form);
    const fields: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string' && key !== 'phone_alt' && value.trim()) {
        fields[key] = value;
      }
    });

    try {
      const { data, error } = await supabase.functions.invoke('send-form-email', {
        body: { form_type: 'certyfikacja', fields },
      });
      if (error || !data?.success) {
        setFormStatus('error');
        return;
      }
      setFormStatus('success');
      setConsentEmail(false);
      setConsentPhone(false);
    } catch {
      setFormStatus('error');
    }
  };

  return (
    <section id="zgloszenie" className="relative py-14 md:py-20 bg-background-50">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/15 to-transparent" />

      <div className="mx-auto max-w-[1000px] px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600 tracking-wide uppercase">
                <EditableImage contentKey="cert_icon_cta" fallbackSrc="" alt="" className="h-3.5 w-3.5 object-contain">
                  <i className="ri-send-plane-line"></i>
                </EditableImage>
                <EditableText contentKey="cert_cta_badge" fallback={t('cert.cta_badge')} />
              </span>
              <h2 className="mt-5 font-heading text-3xl md:text-4xl font-bold text-foreground-950 tracking-tight">
                <EditableColor contentKey="color_cert_cta_title" fallbackColor="#0F172A">
                  <EditableText contentKey="cert_cta_title" fallback={t('cert.cta_title')} />
                </EditableColor>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-foreground-500 max-w-[420px]">
                <EditableText contentKey="cert_cta_desc" fallback={t('cert.cta_desc')} as="span" />
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50">
                    <i className="ri-check-line text-primary-500"></i>
                  </div>
                  <span className="text-sm text-foreground-500"><EditableText contentKey={`cert_cta_trust_${num}`} fallback={t(`cert.cta_trust_${num}`)} /></span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {formStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-primary-200/50 bg-background-100 p-10 text-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 border border-primary-200 mb-5">
                  <i className="ri-check-line text-3xl text-primary-500"></i>
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground-900 mb-2">
                  <EditableColor contentKey="color_cert_success_title" fallbackColor="#0F172A">
                    <EditableText contentKey="cert_success_title" fallback={t('cert.form_success_title')} />
                  </EditableColor>
                </h3>
                <p className="text-sm text-foreground-500 max-w-[300px]">
                  <EditableText contentKey="cert_form_success_desc" fallback={t('cert.form_success_desc')} as="span" />
                </p>
              </div>
            ) : (
              <form
                data-readdy-form="certyfikacja-audyt"
                onSubmit={handleSubmit}
                className="rounded-2xl border border-background-200/70 bg-background-100 p-6 md:p-8 space-y-5 shadow-sm"
              >
                {/* Honeypot */}
                <input
                  name="phone_alt"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="form-honeypot"
                />

                <div>
                  <label htmlFor="audyt-name" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    <EditableText contentKey="cert_form_name_label" fallback={t('cert.form_name_label')} />
                  </label>
                  <input
                    id="audyt-name"
                    name="name"
                    required
                    className="w-full rounded-lg border border-background-200 bg-background-50 px-4 py-3 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('cert.form_name_placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="audyt-email" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    <EditableText contentKey="cert_form_email_label" fallback={t('cert.form_email_label')} />
                  </label>
                  <input
                    id="audyt-email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-background-200 bg-background-50 px-4 py-3 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('cert.form_email_placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="audyt-phone" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    <EditableText contentKey="cert_form_phone_label" fallback={t('cert.form_phone_label')} />
                  </label>
                  <input
                    id="audyt-phone"
                    name="phone"
                    type="tel"
                    required
                    className="w-full rounded-lg border border-background-200 bg-background-50 px-4 py-3 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('cert.form_phone_placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="audyt-facility" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    <EditableText contentKey="cert_form_facility_label" fallback={t('cert.form_facility_label')} />
                  </label>
                  <input
                    id="audyt-facility"
                    name="facility"
                    required
                    className="w-full rounded-lg border border-background-200 bg-background-50 px-4 py-3 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('cert.form_facility_placeholder')}
                  />
                </div>
                <div>
                  <label htmlFor="audyt-type" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    <EditableText contentKey="cert_form_type_label" fallback={t('cert.form_type_label')} />
                  </label>
                  <select
                    id="audyt-type"
                    name="facility_type"
                    required
                    className="w-full rounded-lg border border-background-200 bg-background-50 px-4 py-3 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      <EditableText contentKey="cert_form_type_default" fallback={t('cert.form_type_default')} />
                    </option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={t(`cert.form_type_${num}`)}>
                        {t(`cert.form_type_${num}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="audyt-message" className="mb-1.5 block text-sm font-medium text-foreground-700">
                    <EditableText contentKey="cert_form_message_label" fallback={t('cert.form_message_label')} />
                  </label>
                  <textarea
                    id="audyt-message"
                    name="message"
                    maxLength={500}
                    rows={4}
                    onChange={(e) => setCharCount(e.target.value.length)}
                    className="w-full resize-none rounded-lg border border-background-200 bg-background-50 px-4 py-3 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    placeholder={t('cert.form_message_placeholder')}
                  />
                  <p className="mt-1 text-right text-xs text-foreground-400">
                    {charCount}/500
                  </p>
                </div>

                {/* Consent checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consent_email"
                      checked={consentEmail}
                      onChange={(e) => { setConsentEmail(e.target.checked); setConsentError(''); }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/30"
                    />
                    <span className="text-sm text-foreground-700"><EditableText contentKey="cert_consent_email" fallback={t('cert.consent_email', { defaultValue: 'Wyrażam zgodę na przetwarzanie moich danych osobowych i przesyłanie informacji handlowych drogą mailową. Wiem, że zgodę mogę odwołać' })} as="span" /></span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consent_phone"
                      checked={consentPhone}
                      onChange={(e) => { setConsentPhone(e.target.checked); }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-background-300 text-primary-500 focus:ring-primary-400/30"
                    />
                    <span className="text-sm text-foreground-700"><EditableText contentKey="cert_consent_phone" fallback={t('cert.consent_phone', { defaultValue: 'Wyrażam zgodę na przetwarzanie moich danych osobowych i przesyłanie informacji handlowych drogą telefoniczną. Wiem, że zgodę mogę odwołać' })} as="span" /></span>
                  </label>
                </div>

                {/* Legal links */}
                <p className="text-xs text-foreground-500">
                  <EditableText contentKey="cert_legal_text" fallback="Zapoznaj się z" as="span" />{' '}
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
                    <EditableText contentKey="cert_ado_info" fallback={t('cert.ado_info', { defaultValue: 'Administratorem danych osobowych jest Sportowy Vibe (Robert Zając, e-mail: kontakt@sportowyvibe.pl). Twoje dane przetwarzane są wyłącznie w celu udzielenia odpowiedzi na zapytanie o audyt — podstawą prawną jest art. 6 ust. 1 lit. a RODO (zgoda).' })} as="span" />
                  </p>
                </div>

                {consentError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                    <i className="ri-error-warning-line text-sm"></i>
                    {consentError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full cursor-pointer inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary-500 px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <i className="ri-send-plane-line"></i>
                  {formStatus === 'submitting' ? (
                    <EditableText contentKey="cert_form_sending" fallback={t('cert.form_sending')} />
                  ) : (
                    <EditableText contentKey="cert_form_submit" fallback={t('cert.form_submit')} />
                  )}
                </button>
                {formStatus === 'error' && (
                  <p className="text-sm text-red-500 text-center">
                    <EditableText contentKey="cert_form_error" fallback={t('cert.form_error')} as="span" />
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