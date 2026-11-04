import { useState, useEffect, useCallback } from 'react';
import { fetchAllContent, updateContent, bustContentCache, type SiteContent } from '@/data/siteContent';
import i18n from '@/i18n';

// ─── Fallback display helper — tries to resolve actual default text ───
function resolveFallbackText(contentKey: string): string | null {
  // Common contentKey → i18n key patterns
  const i18nKeyMap: Record<string, string> = {
    home_hero_badge: 'home.hero_badge',
    home_hero_headline_1: 'home.hero_headline_1',
    home_hero_headline_2: 'home.hero_headline_2',
    home_hero_description: 'home.hero_description',
    home_hero_cta_news: 'home.hero_cta_news',
    home_hero_cta_community: 'home.hero_cta_community',
    home_about_badge: 'home.about_badge',
    home_about_title: 'home.about_title',
    home_about_description: 'home.about_description',
    home_formats_badge: 'home.formats_badge',
    home_formats_title: 'home.formats_title',
    home_formats_description: 'home.formats_description',
    formats_title_primary: 'formats.live_title',
    formats_title_accent: 'formats.shorts_title',
    formats_title_secondary: 'formats.posts_title',
    formats_desc_primary: 'formats.live_desc',
    formats_desc_accent: 'formats.shorts_desc',
    formats_desc_secondary: 'formats.posts_desc',
    home_youtube_badge: 'home.youtube_badge',
    home_youtube_title: 'home.youtube_title',
    home_youtube_description: 'home.youtube_description',
    home_stats_badge: 'home.stats_badge',
    home_stats_title: 'home.stats_title',
    home_stats_description: 'home.stats_description',
    home_goals_badge: 'home.goals_badge',
    home_goals_title: 'home.goals_title',
    home_partners_badge: 'home.partners_badge',
    home_partners_title: 'home.partners_title',
    home_partners_description: 'home.partners_description',
    home_certyfikacja_badge: 'home.certyfikacja_badge',
    home_certyfikacja_title: 'home.certyfikacja_title',
    home_certyfikacja_description: 'home.certyfikacja_description',
    home_certyfikacja_stadium_caption: 'certification.stadium_caption',
    home_certyfikacja_stadium_sub: 'certification.stadium_sub',
    home_contact_badge: 'home.contact_badge',
    home_contact_title: 'home.contact_title',
    home_news_badge: 'home.news_badge',
    home_news_title: 'home.news_title',
    home_news_desc: 'home.news_desc',
    home_timeline_badge: 'home.timeline_badge',
    home_timeline_title: 'home.timeline_title',
    home_basketball_badge: 'home.basketball_badge',
    home_basketball_title: 'home.basketball_title',
    home_basketball_desc: 'home.basketball_desc',
    footer_rights: 'footer.rights',
    footer_tagline: 'footer.tagline',
    footer_nav_home: 'footer.nav_home',
    footer_nav_movies: 'footer.nav_movies',
    footer_nav_about: 'footer.nav_about',
    footer_nav_contact: 'footer.nav_contact',
    footer_nav_cooperation: 'footer.nav_cooperation',
    footer_nav_privacy: 'footer.nav_privacy',
    footer_nav_rodo: 'footer.nav_rodo',
    footer_nav_terms: 'footer.nav_terms',
    aktualnosci_hero_title: 'aktualnosci.hero_title',
    aktualnosci_hero_desc: 'aktualnosci.hero_desc',
    aktualnosci_disciplines_badge: 'aktualnosci.disciplines_badge',
    aktualnosci_disciplines_title: 'aktualnosci.disciplines_title',
    cert_hero_badge: 'cert.hero_badge',
    cert_hero_title_line1: 'cert.hero_title_line1',
    cert_hero_title_line2: 'cert.hero_title_line2',
    cert_hero_desc: 'cert.hero_desc',
    fan_zone_badge: 'fan_zone.badge',
    fan_zone_hero_desc: 'fan_zone.hero_desc',
    nasz_kanal_hero_title: 'nasz_kanal.hero_title',
    nasz_kanal_hero_desc: 'nasz_kanal.hero_desc',
    historia_hero_badge: 'historia.hero_badge',
    historia_hero_title: 'historia.hero_title',
    historia_hero_desc: 'historia.hero_desc',
    moderatorzy_hero_badge: 'moderatorzy.hero_badge',
    moderatorzy_hero_title: 'moderatorzy.hero_title',
    moderatorzy_hero_desc: 'moderatorzy.hero_desc',
    tworcy_hero_badge: 'tworcy.hero_badge',
    tworcy_hero_title: 'tworcy.hero_title',
    tworcy_hero_desc: 'tworcy.hero_desc',
    wspolpraca_hero_badge: 'wspolpraca.hero_badge',
    wspolpraca_hero_title: 'wspolpraca.hero_title',
    wspolpraca_hero_desc: 'wspolpraca.hero_desc',
    privacy_pl_label: 'privacy.pl_label',
    privacy_en_label: 'privacy.en_label',
    privacy_pl_title: 'privacy.pl_title',
    privacy_pl_date: 'privacy.pl_date',
    privacy_pl_footer: 'privacy.pl_footer',
    terms_pl_label: 'terms.pl_label',
    terms_pl_title: 'terms.pl_title',
    terms_pl_date: 'terms.pl_date',
    terms_pl_footer: 'terms.pl_footer',
    dyscyplina_hero_title: 'dyscyplina.hero_title',
    dyscyplina_hero_desc: 'dyscyplina.hero_desc',
    dyscyplina_articles_badge: 'dyscyplina.articles_badge',
    dyscyplina_articles_title: 'dyscyplina.articles_title',
    dyscyplina_archive_badge: 'dyscyplina.archive_badge',
    dyscyplina_archive_title: 'dyscyplina.archive_title',
    dyscyplina_cta_text: 'dyscyplina.cta_text',
    harmonogram_hero_title: 'harmonogram.title',
    harmonogram_hero_desc: 'harmonogram.desc',
    harmonogram_table_title: 'harmonogram.table_title',
    harmonogram_cta_title: 'harmonogram.cta_title',
    harmonogram_cta_desc: 'harmonogram.cta_desc',
    filmy_hero_title: 'nasze_filmy.hero_title',
    filmy_hero_desc: 'nasze_filmy.hero_desc',
    filmy_cta_title: 'nasze_filmy.cta_title',
    filmy_cta_desc: 'nasze_filmy.cta_desc',
    artykul_title: 'artykul.title',
    artykul_summary: 'artykul.summary',
    artykul_badge: 'artykul.badge',
    kanal_aktualnosc_title: 'kanal_aktualnosc.title',
    kanal_aktualnosc_desc: 'kanal_aktualnosc.desc',
    o_nas_hero_badge: 'o_nas.hero_badge',
    o_nas_hero_title: 'o_nas.hero_title',
    o_nas_hero_desc: 'o_nas.hero_desc',
    ustawienia_hero_title: 'ustawienia.hero_title',
    ustawienia_hero_desc: 'ustawienia.hero_desc',
    wspolpraca_partners_title: 'wspolpraca.partners_title',
    wspolpraca_partners_desc: 'wspolpraca.partners_desc',
    wspolpraca_cta_title: 'wspolpraca.cta_title',
    wspolpraca_cta_desc: 'wspolpraca.cta_desc',
    wspolpraca_booking_title: 'booking.section_title',
    wspolpraca_booking_desc: 'booking.section_desc',
    wspolpraca_form_title: 'wspolpraca.form_title',
    wspolpraca_form_desc: 'wspolpraca.form_desc',
    wspolpraca_booking_section_badge: 'booking.section_badge',
    wspolpraca_form_badge: 'wspolpraca.form_badge',
    contact_ado_info: 'contact.ado_info',
    cert_ado_info: 'cert.ado_info',
    wspolpraca_ado_info: 'wspolpraca.ado_info',
    // Certyfikacja — Hero (dodatkowe)
    cert_hero_cta_start: 'cert.hero_cta_start',
    cert_hero_cta_how: 'cert.hero_cta_how',
    cert_hero_info_1: 'cert.hero_info_1',
    cert_hero_info_2: 'cert.hero_info_2',
    cert_hero_info_3: 'cert.hero_info_3',
    // Certyfikacja — Proces
    cert_process_badge: 'cert.process_badge',
    cert_process_title: 'cert.process_title',
    cert_process_desc: 'cert.process_desc',
    cert_step_1_title: 'cert.step_1_title',
    cert_step_1_desc: 'cert.step_1_desc',
    cert_step_2_title: 'cert.step_2_title',
    cert_step_2_desc: 'cert.step_2_desc',
    cert_step_3_title: 'cert.step_3_title',
    cert_step_3_desc: 'cert.step_3_desc',
    cert_step_4_title: 'cert.step_4_title',
    cert_step_4_desc: 'cert.step_4_desc',
    cert_step_5_title: 'cert.step_5_title',
    cert_step_5_desc: 'cert.step_5_desc',
    cert_step_6_title: 'cert.step_6_title',
    cert_step_6_desc: 'cert.step_6_desc',
    cert_step_7_title: 'cert.step_7_title',
    cert_step_7_desc: 'cert.step_7_desc',
    // Certyfikacja — Korzyści
    cert_benefits_badge: 'cert.benefits_badge',
    cert_benefits_title: 'cert.benefits_title',
    cert_benefits_desc: 'cert.benefits_desc',
    cert_benefit_1_title: 'cert.benefit_1_title',
    cert_benefit_1_desc: 'cert.benefit_1_desc',
    cert_benefit_2_title: 'cert.benefit_2_title',
    cert_benefit_2_desc: 'cert.benefit_2_desc',
    cert_benefit_3_title: 'cert.benefit_3_title',
    cert_benefit_3_desc: 'cert.benefit_3_desc',
    cert_benefit_4_title: 'cert.benefit_4_title',
    cert_benefit_4_desc: 'cert.benefit_4_desc',
    cert_benefit_5_title: 'cert.benefit_5_title',
    cert_benefit_5_desc: 'cert.benefit_5_desc',
    cert_benefit_6_title: 'cert.benefit_6_title',
    cert_benefit_6_desc: 'cert.benefit_6_desc',
    // Certyfikacja — FAQ
    cert_faq_badge: 'cert.faq_badge',
    cert_faq_title: 'cert.faq_title',
    cert_faq_1_q: 'cert.faq_1_q',
    cert_faq_1_a: 'cert.faq_1_a',
    cert_faq_2_q: 'cert.faq_2_q',
    cert_faq_2_a: 'cert.faq_2_a',
    cert_faq_3_q: 'cert.faq_3_q',
    cert_faq_3_a: 'cert.faq_3_a',
    cert_faq_4_q: 'cert.faq_4_q',
    cert_faq_4_a: 'cert.faq_4_a',
    cert_faq_5_q: 'cert.faq_5_q',
    cert_faq_5_a: 'cert.faq_5_a',
    // Certyfikacja — Formularz
    cert_cta_badge: 'cert.cta_badge',
    cert_cta_title: 'cert.cta_title',
    cert_cta_desc: 'cert.cta_desc',
    cert_cta_trust_1: 'cert.cta_trust_1',
    cert_cta_trust_2: 'cert.cta_trust_2',
    cert_cta_trust_3: 'cert.cta_trust_3',
    cert_cta_trust_4: 'cert.cta_trust_4',
    cert_form_name_label: 'cert.form_name_label',
    cert_form_email_label: 'cert.form_email_label',
    cert_form_phone_label: 'cert.form_phone_label',
    cert_form_facility_label: 'cert.form_facility_label',
    cert_form_type_label: 'cert.form_type_label',
    cert_form_type_default: 'cert.form_type_default',
    cert_form_message_label: 'cert.form_message_label',
    cert_form_submit: 'cert.form_submit',
    cert_form_sending: 'cert.form_sending',
    cert_form_error: 'cert.form_error',
    cert_form_success_desc: 'cert.form_success_desc',
    cert_success_title: 'cert.form_success_title',
    cert_consent_email: 'cert.consent_email',
    cert_consent_phone: 'cert.consent_phone',
    // Certyfikacja — Stopka
    cert_footer_rights: 'cert.footer_rights',
  };
  // Shadow fallbacks — show default CSS values
  const SHADOW_FALLBACKS: Record<string, string> = {
    shadow_home_hero_h1_1: '0 3px 14px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)',
    shadow_home_hero_h1_2: '0 3px 14px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)',
    shadow_home_hero_p: '0 2px 8px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)',
    shadow_o_nas_hero_h1: '0 2px 10px rgba(0,0,0,0.45)',
    shadow_o_nas_hero_p: '0 2px 8px rgba(0,0,0,0.32)',
    shadow_historia_hero_h1: '0 2px 10px rgba(0,0,0,0.45)',
    shadow_historia_hero_p: '0 2px 8px rgba(0,0,0,0.32)',
    shadow_tworcy_hero_h1: '0 2px 10px rgba(0,0,0,0.45)',
    shadow_tworcy_hero_p: '0 2px 8px rgba(0,0,0,0.32)',
    shadow_wspolpraca_hero_h1: '0 2px 10px rgba(0,0,0,0.45)',
    shadow_wspolpraca_hero_p: '0 2px 8px rgba(0,0,0,0.32)',
    shadow_dyscyplina_hero_h1: '0 2px 13px rgba(0,0,0,0.65)',
    shadow_dyscyplina_hero_p: '0 2px 10px rgba(0,0,0,0.52)',
    shadow_harmonogram_hero_h1: '0 2px 13px rgba(0,0,0,0.65)',
    shadow_harmonogram_hero_p: '0 2px 10px rgba(0,0,0,0.52)',
    shadow_certyfikacja_stadium_caption: '0 1px 5px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.35)',
    shadow_certyfikacja_stadium_sub: '0 1px 4px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)',
  };

  // Quick check for shadow keys
  if (SHADOW_FALLBACKS[contentKey]) {
    return `Domyślnie: ${SHADOW_FALLBACKS[contentKey]}`;
  }

  const i18nKey = i18nKeyMap[contentKey];
  if (!i18nKey) return null;
  try {
    const result = i18n.t(i18nKey, { lng: 'pl' });
    // If the result is just the key back, translation is not defined
    if (result === i18nKey || result === contentKey) return null;
    return result;
  } catch {
    return null;
  }
}

// ─── Master list of ALL editable text keys grouped by page/section ───
interface ContentKeyMeta {
  key: string;
  label: string;
}

interface ContentGroup {
  group: string;
  icon: string;
  keys: ContentKeyMeta[];
}

const ALL_CONTENT_GROUPS: ContentGroup[] = [
  {
    group: 'Strona główna — Hero',
    icon: 'ri-home-heart-line',
    keys: [
      { key: 'home_hero_badge', label: 'Badge (etykieta)' },
      { key: 'home_hero_headline_1', label: 'Nagłówek główny — linia 1' },
      { key: 'home_hero_headline_2', label: 'Nagłówek główny — linia 2' },
      { key: 'home_hero_description', label: 'Opis' },
      { key: 'home_hero_cta_news', label: 'Przycisk — Aktualności' },
      { key: 'home_hero_cta_community', label: 'Przycisk — Społeczność' },
      { key: 'home_hero_background_video', label: 'URL tła hero (wideo .mp4 lub obrazek)' },
    ],
  },
  {
    group: 'Strona główna — Cienie tekstów (Hero)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_home_hero_h1_1', label: 'Cień — Nagłówek linia 1 (CSS text-shadow)' },
      { key: 'shadow_home_hero_h1_2', label: 'Cień — Nagłówek linia 2 (CSS text-shadow)' },
      { key: 'shadow_home_hero_p', label: 'Cień — Paragraf opisowy (CSS text-shadow)' },
    ],
  },
  {
    group: 'O nas — Cienie (Hero)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_o_nas_hero_h1', label: 'Cień — Nagłówek H1 (CSS text-shadow)' },
      { key: 'shadow_o_nas_hero_p', label: 'Cień — Paragraf (CSS text-shadow)' },
    ],
  },
  {
    group: 'Historia — Cienie (Hero)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_historia_hero_h1', label: 'Cień — Nagłówek H1 (CSS text-shadow)' },
      { key: 'shadow_historia_hero_p', label: 'Cień — Paragraf (CSS text-shadow)' },
    ],
  },
  {
    group: 'Twórcy — Cienie (Hero)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_tworcy_hero_h1', label: 'Cień — Nagłówek H1 (CSS text-shadow)' },
      { key: 'shadow_tworcy_hero_p', label: 'Cień — Paragraf (CSS text-shadow)' },
    ],
  },
  {
    group: 'Współpraca — Cienie (Hero)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_wspolpraca_hero_h1', label: 'Cień — Nagłówek H1 (CSS text-shadow)' },
      { key: 'shadow_wspolpraca_hero_p', label: 'Cień — Paragraf (CSS text-shadow)' },
    ],
  },
  {
    group: 'Dyscypliny — Cienie (Hero)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_dyscyplina_hero_h1', label: 'Cień — Nagłówek H1 (CSS text-shadow)' },
      { key: 'shadow_dyscyplina_hero_p', label: 'Cień — Paragraf (CSS text-shadow)' },
    ],
  },
  {
    group: 'Harmonogram — Cienie (Hero)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_harmonogram_hero_h1', label: 'Cień — Nagłówek H1 (CSS text-shadow)' },
      { key: 'shadow_harmonogram_hero_p', label: 'Cień — Paragraf (CSS text-shadow)' },
    ],
  },
  {
    group: 'Strona główna — O nas',
    icon: 'ri-information-line',
    keys: [
      { key: 'home_about_badge', label: 'Badge' },
      { key: 'home_about_title', label: 'Tytuł' },
      { key: 'home_about_description', label: 'Opis' },
    ],
  },
  {
    group: 'Strona główna — Formaty',
    icon: 'ri-stack-line',
    keys: [
      { key: 'home_formats_badge', label: 'Badge' },
      { key: 'home_formats_title', label: 'Tytuł' },
      { key: 'home_formats_description', label: 'Opis' },
    ],
  },
  {
    group: 'Strona główna — Formaty (karty)',
    icon: 'ri-stack-line',
    keys: [
      { key: 'formats_title_primary', label: 'Karta 1 — Tytuł (Transmisje Live)' },
      { key: 'formats_desc_primary', label: 'Karta 1 — Opis (Transmisje Live)' },
      { key: 'formats_title_accent', label: 'Karta 2 — Tytuł (Shorty)' },
      { key: 'formats_desc_accent', label: 'Karta 2 — Opis (Shorty)' },
      { key: 'formats_title_secondary', label: 'Karta 3 — Tytuł (Posty)' },
      { key: 'formats_desc_secondary', label: 'Karta 3 — Opis (Posty)' },
    ],
  },
  {
    group: 'Strona główna — YouTube',
    icon: 'ri-youtube-line',
    keys: [
      { key: 'home_youtube_badge', label: 'Badge' },
      { key: 'home_youtube_title', label: 'Tytuł' },
      { key: 'home_youtube_description', label: 'Opis' },
    ],
  },
  {
    group: 'Strona główna — Statystyki',
    icon: 'ri-bar-chart-line',
    keys: [
      { key: 'home_stats_badge', label: 'Badge' },
      { key: 'home_stats_title', label: 'Tytuł' },
      { key: 'home_stats_description', label: 'Opis' },
    ],
  },
  {
    group: 'Strona główna — Cele',
    icon: 'ri-flag-line',
    keys: [
      { key: 'home_goals_badge', label: 'Badge' },
      { key: 'home_goals_title', label: 'Tytuł' },
    ],
  },
  {
    group: 'Strona główna — Partnerzy',
    icon: 'ri-service-line',
    keys: [
      { key: 'home_partners_badge', label: 'Badge' },
      { key: 'home_partners_title', label: 'Tytuł' },
      { key: 'home_partners_description', label: 'Opis' },
    ],
  },
  {
    group: 'Strona główna — Certyfikacja',
    icon: 'ri-medal-line',
    keys: [
      { key: 'home_certyfikacja_badge', label: 'Badge' },
      { key: 'home_certyfikacja_title', label: 'Tytuł' },
      { key: 'home_certyfikacja_description', label: 'Opis' },
    ],
  },
  {
    group: 'Strona główna — Certyfikacja — Cienie (obrazek)',
    icon: 'ri-contrast-drop-line',
    keys: [
      { key: 'shadow_certyfikacja_stadium_caption', label: 'Cień — Podpis na obrazku stadionu (CSS text-shadow)' },
      { key: 'shadow_certyfikacja_stadium_sub', label: 'Cień — Podtytuł na obrazku stadionu (CSS text-shadow)' },
    ],
  },
  {
    group: 'Strona główna — Certyfikacja — Teksty na obrazku',
    icon: 'ri-file-text-line',
    keys: [
      { key: 'home_certyfikacja_stadium_caption', label: 'Podpis — Stadion (widoczność)' },
      { key: 'home_certyfikacja_stadium_sub', label: 'Podtytuł — Stadion (projektujemy)' },
    ],
  },
  {
    group: 'Strona główna — Kontakt',
    icon: 'ri-mail-line',
    keys: [
      { key: 'home_contact_badge', label: 'Badge' },
      { key: 'home_contact_title', label: 'Tytuł' },
    ],
  },
  {
    group: 'Stopka',
    icon: 'ri-layout-bottom-line',
    keys: [
      { key: 'footer_tagline', label: 'Slogan / opis' },
      { key: 'footer_nav_home', label: 'Link — Strona główna' },
      { key: 'footer_nav_movies', label: 'Link — Filmy' },
      { key: 'footer_nav_about', label: 'Link — O nas' },
      { key: 'footer_nav_contact', label: 'Link — Kontakt' },
      { key: 'footer_nav_cooperation', label: 'Link — Współpraca' },
      { key: 'footer_nav_privacy', label: 'Link — Polityka prywatności' },
      { key: 'footer_nav_rodo', label: 'Link — RODO' },
      { key: 'footer_nav_terms', label: 'Link — Regulamin serwisu' },
      { key: 'footer_rights', label: 'Prawa autorskie' },
    ],
  },
  {
    group: 'Aktualności',
    icon: 'ri-newspaper-line',
    keys: [
      { key: 'aktualnosci_hero_title', label: 'Tytuł hero' },
      { key: 'aktualnosci_hero_desc', label: 'Opis hero' },
      { key: 'aktualnosci_disciplines_badge', label: 'Badge — Dyscypliny' },
      { key: 'aktualnosci_disciplines_title', label: 'Tytuł — Dyscypliny' },
    ],
  },
  {
    group: 'Certyfikacja — Hero',
    icon: 'ri-award-line',
    keys: [
      { key: 'cert_hero_badge', label: 'Badge hero' },
      { key: 'cert_hero_title_line1', label: 'Tytuł hero — linia 1' },
      { key: 'cert_hero_title_line2', label: 'Tytuł hero — linia 2' },
      { key: 'cert_hero_desc', label: 'Opis hero' },
      { key: 'cert_hero_cta_start', label: 'Przycisk CTA — Rozpocznij proces' },
      { key: 'cert_hero_cta_how', label: 'Przycisk — Jak to działa?' },
      { key: 'cert_hero_info_1', label: 'Info — 80% dofinansowania PFRON' },
      { key: 'cert_hero_info_2', label: 'Info — Uznawany międzynarodowo' },
      { key: 'cert_hero_info_3', label: 'Info — Proces 4-8 tygodni' },
    ],
  },
  {
    group: 'Certyfikacja — Nawigacja i stopka',
    icon: 'ri-compass-3-line',
    keys: [
      { key: 'cert_nav_process', label: 'Nawigacja — Proces' },
      { key: 'cert_nav_benefits', label: 'Nawigacja — Korzyści' },
      { key: 'cert_nav_faq', label: 'Nawigacja — FAQ' },
      { key: 'cert_nav_submit', label: 'Nawigacja — Zgłoszenie' },
      { key: 'cert_footer_rights', label: 'Stopka — Prawa autorskie' },
    ],
  },
  {
    group: 'Certyfikacja — Proces (7 kroków)',
    icon: 'ri-route-line',
    keys: [
      { key: 'cert_process_badge', label: 'Badge' },
      { key: 'cert_process_title', label: 'Tytuł' },
      { key: 'cert_process_desc', label: 'Opis' },
      { key: 'cert_step_1_title', label: 'Krok 1 — Tytuł' },
      { key: 'cert_step_1_desc', label: 'Krok 1 — Opis' },
      { key: 'cert_step_2_title', label: 'Krok 2 — Tytuł' },
      { key: 'cert_step_2_desc', label: 'Krok 2 — Opis' },
      { key: 'cert_step_3_title', label: 'Krok 3 — Tytuł' },
      { key: 'cert_step_3_desc', label: 'Krok 3 — Opis' },
      { key: 'cert_step_4_title', label: 'Krok 4 — Tytuł' },
      { key: 'cert_step_4_desc', label: 'Krok 4 — Opis' },
      { key: 'cert_step_5_title', label: 'Krok 5 — Tytuł' },
      { key: 'cert_step_5_desc', label: 'Krok 5 — Opis' },
      { key: 'cert_step_6_title', label: 'Krok 6 — Tytuł' },
      { key: 'cert_step_6_desc', label: 'Krok 6 — Opis' },
      { key: 'cert_step_7_title', label: 'Krok 7 — Tytuł' },
      { key: 'cert_step_7_desc', label: 'Krok 7 — Opis' },
    ],
  },
  {
    group: 'Certyfikacja — Korzyści (6 benefitów)',
    icon: 'ri-star-line',
    keys: [
      { key: 'cert_benefits_badge', label: 'Badge' },
      { key: 'cert_benefits_title', label: 'Tytuł' },
      { key: 'cert_benefits_desc', label: 'Opis' },
      { key: 'cert_benefit_1_title', label: 'Benefit 1 — Tytuł' },
      { key: 'cert_benefit_1_desc', label: 'Benefit 1 — Opis' },
      { key: 'cert_benefit_2_title', label: 'Benefit 2 — Tytuł' },
      { key: 'cert_benefit_2_desc', label: 'Benefit 2 — Opis' },
      { key: 'cert_benefit_3_title', label: 'Benefit 3 — Tytuł' },
      { key: 'cert_benefit_3_desc', label: 'Benefit 3 — Opis' },
      { key: 'cert_benefit_4_title', label: 'Benefit 4 — Tytuł' },
      { key: 'cert_benefit_4_desc', label: 'Benefit 4 — Opis' },
      { key: 'cert_benefit_5_title', label: 'Benefit 5 — Tytuł' },
      { key: 'cert_benefit_5_desc', label: 'Benefit 5 — Opis' },
      { key: 'cert_benefit_6_title', label: 'Benefit 6 — Tytuł' },
      { key: 'cert_benefit_6_desc', label: 'Benefit 6 — Opis' },
    ],
  },
  {
    group: 'Certyfikacja — FAQ (5 pytań)',
    icon: 'ri-question-answer-line',
    keys: [
      { key: 'cert_faq_badge', label: 'Badge' },
      { key: 'cert_faq_title', label: 'Tytuł' },
      { key: 'cert_faq_1_q', label: 'FAQ 1 — Pytanie' },
      { key: 'cert_faq_1_a', label: 'FAQ 1 — Odpowiedź' },
      { key: 'cert_faq_2_q', label: 'FAQ 2 — Pytanie' },
      { key: 'cert_faq_2_a', label: 'FAQ 2 — Odpowiedź' },
      { key: 'cert_faq_3_q', label: 'FAQ 3 — Pytanie' },
      { key: 'cert_faq_3_a', label: 'FAQ 3 — Odpowiedź' },
      { key: 'cert_faq_4_q', label: 'FAQ 4 — Pytanie' },
      { key: 'cert_faq_4_a', label: 'FAQ 4 — Odpowiedź' },
      { key: 'cert_faq_5_q', label: 'FAQ 5 — Pytanie' },
      { key: 'cert_faq_5_a', label: 'FAQ 5 — Odpowiedź' },
    ],
  },
  {
    group: 'Certyfikacja — Formularz zgłoszeniowy',
    icon: 'ri-send-plane-line',
    keys: [
      { key: 'cert_cta_badge', label: 'Badge CTA' },
      { key: 'cert_cta_title', label: 'Tytuł CTA' },
      { key: 'cert_cta_desc', label: 'Opis CTA' },
      { key: 'cert_cta_trust_1', label: 'Trust — Bezpłatna konsultacja' },
      { key: 'cert_cta_trust_2', label: 'Trust — Odpowiedź w 24h' },
      { key: 'cert_cta_trust_3', label: 'Trust — Pomoc PFRON' },
      { key: 'cert_cta_trust_4', label: 'Trust — Certyfikat międzynarodowy' },
      { key: 'cert_form_name_label', label: 'Label — Imię i nazwisko' },
      { key: 'cert_form_email_label', label: 'Label — Adres e-mail' },
      { key: 'cert_form_phone_label', label: 'Label — Telefon' },
      { key: 'cert_form_facility_label', label: 'Label — Nazwa obiektu' },
      { key: 'cert_form_type_label', label: 'Label — Typ obiektu' },
      { key: 'cert_form_type_default', label: 'Select — Wybierz typ...' },
      { key: 'cert_form_message_label', label: 'Label — Dodatkowe informacje' },
      { key: 'cert_form_submit', label: 'Button — Zgłoś obiekt' },
      { key: 'cert_form_sending', label: 'Button — Wysyłanie...' },
      { key: 'cert_form_error', label: 'Komunikat błędu formularza' },
      { key: 'cert_form_success_desc', label: 'Opis po sukcesie' },
      { key: 'cert_success_title', label: 'Tytuł po sukcesie' },
      { key: 'cert_consent_email', label: 'Zgoda — email' },
      { key: 'cert_consent_phone', label: 'Zgoda — telefon' },
      { key: 'cert_legal_text', label: 'Tekst — Zapoznaj się z...' },
    ],
  },
  {
    group: 'Strefa Kibica',
    icon: 'ri-user-heart-line',
    keys: [
      { key: 'fan_zone_badge', label: 'Badge' },
      { key: 'fan_zone_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'Nasz Kanał',
    icon: 'ri-tv-line',
    keys: [
      { key: 'nasz_kanal_hero_title', label: 'Tytuł hero' },
      { key: 'nasz_kanal_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'O nas — Historia',
    icon: 'ri-history-line',
    keys: [
      { key: 'historia_hero_badge', label: 'Badge hero' },
      { key: 'historia_hero_title', label: 'Tytuł hero' },
      { key: 'historia_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'O nas — Moderatorzy',
    icon: 'ri-shield-star-line',
    keys: [
      { key: 'moderatorzy_hero_badge', label: 'Badge hero' },
      { key: 'moderatorzy_hero_title', label: 'Tytuł hero' },
      { key: 'moderatorzy_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'O nas — Twórcy',
    icon: 'ri-team-line',
    keys: [
      { key: 'tworcy_hero_badge', label: 'Badge hero' },
      { key: 'tworcy_hero_title', label: 'Tytuł hero' },
      { key: 'tworcy_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'O nas — Współpraca',
    icon: 'ri-briefcase-line',
    keys: [
      { key: 'wspolpraca_hero_badge', label: 'Badge hero' },
      { key: 'wspolpraca_hero_title', label: 'Tytuł hero' },
      { key: 'wspolpraca_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'Polityka prywatności',
    icon: 'ri-lock-line',
    keys: [
      { key: 'privacy_pl_label', label: 'Etykieta (PL)' },
      { key: 'privacy_en_label', label: 'Etykieta (EN)' },
      { key: 'privacy_pl_title', label: 'Tytuł (PL)' },
      { key: 'privacy_pl_date', label: 'Data dokumentu (PL)' },
      { key: 'privacy_pl_footer', label: 'Stopka dokumentu (PL)' },
    ],
  },
  {
    group: 'Regulamin serwisu',
    icon: 'ri-file-list-3-line',
    keys: [
      { key: 'terms_pl_label', label: 'Etykieta' },
      { key: 'terms_pl_title', label: 'Tytuł' },
      { key: 'terms_pl_date', label: 'Data dokumentu' },
      { key: 'terms_pl_footer', label: 'Stopka dokumentu' },
    ],
  },
  {
    group: 'Dyscyplina (strona szczegółowa)',
    icon: 'ri-archive-line',
    keys: [
      { key: 'dyscyplina_hero_title', label: 'Tytuł hero (nazwa dyscypliny)' },
      { key: 'dyscyplina_hero_desc', label: 'Opis hero' },
      { key: 'dyscyplina_articles_badge', label: 'Badge — artykuły' },
      { key: 'dyscyplina_articles_title', label: 'Tytuł — artykuły' },
      { key: 'dyscyplina_archive_badge', label: 'Badge — archiwum' },
      { key: 'dyscyplina_archive_title', label: 'Tytuł — archiwum' },
      { key: 'dyscyplina_cta_text', label: 'Tekst CTA' },
    ],
  },
  {
    group: 'Harmonogram kanału',
    icon: 'ri-calendar-schedule-line',
    keys: [
      { key: 'harmonogram_hero_badge', label: 'Badge hero' },
      { key: 'harmonogram_hero_title', label: 'Tytuł hero' },
      { key: 'harmonogram_hero_desc', label: 'Opis hero' },
      { key: 'harmonogram_table_title', label: 'Tytuł tabeli' },
      { key: 'harmonogram_cta_title', label: 'Tytuł CTA' },
      { key: 'harmonogram_cta_desc', label: 'Opis CTA' },
    ],
  },
  {
    group: 'Nasze filmy',
    icon: 'ri-movie-line',
    keys: [
      { key: 'filmy_hero_title', label: 'Tytuł hero' },
      { key: 'filmy_hero_desc', label: 'Opis hero' },
      { key: 'filmy_cta_title', label: 'Tytuł CTA' },
      { key: 'filmy_cta_desc', label: 'Opis CTA' },
    ],
  },
  {
    group: 'Artykuł (strona szczegółowa)',
    icon: 'ri-article-line',
    keys: [
      { key: 'artykul_title', label: 'Tytuł artykułu' },
      { key: 'artykul_summary', label: 'Streszczenie' },
      { key: 'artykul_badge', label: 'Badge dyscypliny' },
    ],
  },
  {
    group: 'Aktualność kanału (szczegóły)',
    icon: 'ri-megaphone-line',
    keys: [
      { key: 'kanal_aktualnosc_title', label: 'Tytuł aktualności' },
      { key: 'kanal_aktualnosc_desc', label: 'Opis aktualności' },
    ],
  },
  {
    group: 'O nas (strona główna)',
    icon: 'ri-team-line',
    keys: [
      { key: 'o_nas_hero_badge', label: 'Badge hero' },
      { key: 'o_nas_hero_title', label: 'Tytuł hero' },
      { key: 'o_nas_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'Ustawienia konta',
    icon: 'ri-settings-3-line',
    keys: [
      { key: 'ustawienia_hero_title', label: 'Tytuł hero' },
      { key: 'ustawienia_hero_desc', label: 'Opis hero' },
    ],
  },
  {
    group: 'Strona główna — Aktualności (News)',
    icon: 'ri-flashlight-line',
    keys: [
      { key: 'home_news_badge', label: 'Badge' },
      { key: 'home_news_title', label: 'Tytuł' },
      { key: 'home_news_desc', label: 'Opis' },
    ],
  },
  {
    group: 'Strona główna — Oś czasu (Timeline)',
    icon: 'ri-road-map-line',
    keys: [
      { key: 'home_timeline_badge', label: 'Badge' },
      { key: 'home_timeline_title', label: 'Tytuł' },
    ],
  },
  {
    group: 'Strona główna — Koszykówka (Basketball)',
    icon: 'ri-basketball-line',
    keys: [
      { key: 'home_basketball_badge', label: 'Badge' },
      { key: 'home_basketball_title', label: 'Tytuł' },
      { key: 'home_basketball_desc', label: 'Opis' },
    ],
  },
  {
    group: 'Współpraca — dodatkowe sekcje',
    icon: 'ri-briefcase-line',
    keys: [
      { key: 'wspolpraca_partners_title', label: 'Tytuł — Partnerzy' },
      { key: 'wspolpraca_partners_desc', label: 'Opis — Partnerzy' },
      { key: 'wspolpraca_cta_title', label: 'Tytuł CTA' },
      { key: 'wspolpraca_cta_desc', label: 'Opis CTA' },
      { key: 'wspolpraca_booking_title', label: 'Tytuł — Rezerwacja' },
      { key: 'wspolpraca_booking_desc', label: 'Opis — Rezerwacja' },
      { key: 'wspolpraca_form_title', label: 'Tytuł — Formularz' },
      { key: 'wspolpraca_form_desc', label: 'Opis — Formularz' },
    ],
  },
  {
    group: 'Aktualności — dodatkowe',
    icon: 'ri-newspaper-line',
    keys: [
      { key: 'aktualnosci_disciplines_badge', label: 'Badge — Dyscypliny' },
      { key: 'aktualnosci_disciplines_title', label: 'Tytuł — Dyscypliny' },
    ],
  },
  {
    group: 'ADO / RODO — Informacje prawne w formularzach',
    icon: 'ri-shield-user-line',
    keys: [
      { key: 'contact_ado_info', label: 'ADO — Formularz kontaktowy (strona główna)' },
      { key: 'cert_ado_info', label: 'ADO — Formularz certyfikacji' },
      { key: 'wspolpraca_ado_info', label: 'ADO — Formularz współpracy' },
    ],
  },
  {
    group: 'Czatbot / Asystent AI',
    icon: 'ri-robot-2-line',
    keys: [
      { key: 'chatbot_label_text', label: 'Tekst na przycisku czatbota (pomarańczowe pole)' },
    ],
  },
];

export default function ContentManager() {
  const [items, setItems] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllContent();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getItem = (key: string): SiteContent | undefined =>
    items.find((i) => i.content_key === key);

  const handleStartEdit = (key: string) => {
    const item = getItem(key);
    setEditingKey(key);
    setEditValue(item?.content_text || '');
    setMessage(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (key: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Tekst nie może być pusty — użyj przycisku "Wyczyść" aby usunąć' });
      return;
    }
    setSavingKey(key);
    const ok = await updateContent(key, trimmed);
    setSavingKey(null);
    if (ok) {
      setEditingKey(null);
      setMessage({ type: 'success', text: 'Zapisano!' });
      bustContentCache();
      setItems((prev) => {
        const existing = prev.find((i) => i.content_key === key);
        if (existing) {
          return prev.map((i) =>
            i.content_key === key ? { ...i, content_text: trimmed } : i
          );
        }
        return [
          ...prev,
          { id: Date.now(), content_key: key, content_text: trimmed, updated_at: new Date().toISOString() },
        ];
      });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: 'Błąd zapisu — odśwież stronę i spróbuj ponownie (token mógł wygasnąć)' });
    }
  };

  const handleClear = async (key: string) => {
    setSavingKey(key);
    const ok = await updateContent(key, '');
    setSavingKey(null);
    if (ok) {
      setMessage({ type: 'success', text: 'Przywrócono wartość domyślną' });
      bustContentCache();
      setItems((prev) => prev.filter((i) => i.content_key !== key));
      if (editingKey === key) {
        setEditingKey(null);
        setEditValue('');
      }
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: 'Błąd usuwania — odśwież stronę i spróbuj ponownie' });
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave(key);
    }
  };

  // Filter groups
  const filteredGroups = ALL_CONTENT_GROUPS.map((g) => ({
    ...g,
    keys: g.keys.filter(
      (k) =>
        !filter ||
        k.key.toLowerCase().includes(filter.toLowerCase()) ||
        k.label.toLowerCase().includes(filter.toLowerCase()) ||
        (getItem(k.key)?.content_text || '').toLowerCase().includes(filter.toLowerCase())
    ),
  })).filter((g) => g.keys.length > 0);

  const totalFiltered = filteredGroups.reduce((sum, g) => sum + g.keys.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
          <i className="ri-loader-4-line text-xl"></i>
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground-950">
            Wszystkie teksty na stronie
          </h3>
          <p className="text-xs text-foreground-500 mt-0.5">
            Zarządzaj każdym edytowalnym tekstem — nagłówkami, opisami, przyciskami na wszystkich stronach
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-400"></i>
            <input
              type="text"
              placeholder="Szukaj tekstu lub klucza..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-56 rounded-md border border-background-200 bg-background-50 pl-8 pr-3 py-1.5 text-xs text-foreground-800 outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-300"
            />
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-100 transition-colors whitespace-nowrap"
          >
            <i className="ri-refresh-line text-xs"></i>
            Odśwież
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 rounded-md px-4 py-2.5 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {totalFiltered === 0 ? (
        <div className="text-center py-16">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-foreground-400 mb-3">
            <i className="ri-file-text-line text-xl"></i>
          </span>
          <p className="text-sm text-foreground-500">
            {filter ? 'Brak wyników dla podanego filtra.' : 'Brak treści.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.group);
            const activeCount = group.keys.filter((k) => !!getItem(k.key)?.content_text).length;

            return (
              <div key={group.group} className="rounded-lg border border-background-200/70 bg-background-50 overflow-hidden">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-background-100/50 transition-colors text-left"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-100 text-accent-600 ${isCollapsed ? '' : 'bg-accent-200'}`}>
                    <i className={`${group.icon} text-sm`}></i>
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-foreground-800">{group.group}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-foreground-400 bg-background-100 px-2 py-0.5 rounded-full">
                    {activeCount}/{group.keys.length}
                  </span>
                  <span className={`flex h-6 w-6 items-center justify-center text-foreground-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
                    <i className="ri-arrow-down-s-line text-sm"></i>
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-background-200/70 divide-y divide-background-200/50">
                    {group.keys.map((meta) => {
                      const item = getItem(meta.key);
                      const isEditing = editingKey === meta.key;
                      const hasValue = !!item?.content_text;
                      const isSaving = savingKey === meta.key;

                      return (
                        <div
                          key={meta.key}
                          className={`px-4 py-3 transition-colors ${
                            isEditing ? 'bg-accent-50/40' : 'hover:bg-background-100/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Status dot */}
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                hasValue ? 'bg-green-500' : 'bg-foreground-300'
                              }`}
                              title={hasValue ? 'Ma wartość w bazie' : 'Brak wartości (używa domyślnej)'}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <code className="text-[11px] font-mono text-accent-600 bg-accent-50 px-1.5 py-0.5 rounded">
                                  {meta.key}
                                </code>
                                <span className="text-[11px] text-foreground-500">{meta.label}</span>
                                {item?.updated_at && (
                                  <span className="text-[10px] text-foreground-400">
                                    {new Date(item.updated_at).toLocaleString('pl-PL')}
                                  </span>
                                )}
                                {!hasValue && (
                                  <span className="text-[10px] font-medium text-foreground-400 bg-background-100 px-1.5 py-0.5 rounded">
                                    domyślny
                                  </span>
                                )}
                              </div>

                              {isEditing ? (
                                <div>
                                  {meta.key.includes('description') || meta.key.includes('desc') || meta.key.includes('ado_info') ? (
                                    <textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => handleKeyDown(e, meta.key)}
                                      className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-accent-400 resize-y"
                                      rows={Math.min(editValue.split('\n').length + 1, 8)}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => handleKeyDown(e, meta.key)}
                                      className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-accent-400"
                                    />
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSave(meta.key)}
                                      disabled={isSaving}
                                      className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                                    >
                                      {isSaving ? (
                                        <>
                                          <i className="ri-loader-4-line animate-spin text-xs"></i>
                                          Zapisywanie...
                                        </>
                                      ) : (
                                        <>
                                          <i className="ri-check-line text-xs"></i>
                                          Zapisz
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancel}
                                      className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-background-100 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-200 transition-colors whitespace-nowrap"
                                    >
                                      Anuluj
                                    </button>
                                    {hasValue && (
                                      <button
                                        type="button"
                                        onClick={() => handleClear(meta.key)}
                                        disabled={isSaving}
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
                                      >
                                        <i className="ri-delete-bin-line text-xs"></i>
                                        Wyczyść
                                      </button>
                                    )}
                                    <span className="text-[10px] text-foreground-400 ml-1">Ctrl+Enter</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <p className={`flex-1 text-sm leading-relaxed line-clamp-2 ${hasValue ? 'text-foreground-700' : 'text-foreground-400 italic'}`}>
                                    {hasValue
                                      ? item!.content_text
                                      : (() => {
                                          const fb = resolveFallbackText(meta.key);
                                          return fb ? `Domyślnie: "${fb}"` : '(używa wartości domyślnej z tłumaczeń)';
                                        })()}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(meta.key)}
                                    className="flex-shrink-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:text-accent-500 hover:bg-accent-50 transition-colors"
                                    title={hasValue ? 'Edytuj' : 'Dodaj tekst'}
                                  >
                                    <i className={`${hasValue ? 'ri-pencil-line' : 'ri-add-line'} text-sm`}></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}