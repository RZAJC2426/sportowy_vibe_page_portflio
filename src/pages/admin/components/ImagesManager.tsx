import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllContent, updateContent, bustContentCache, type SiteContent } from '@/data/siteContent';
import { supabase } from '@/lib/supabase';

interface ImageKeyMeta {
  key: string;
  label: string;
  fallbackSrc: string;
}

interface ImageGroup {
  group: string;
  icon: string;
  keys: ImageKeyMeta[];
}

const ALL_IMAGE_GROUPS: ImageGroup[] = [
  {
    group: 'Logotypy',
    icon: 'ri-image-2-line',
    keys: [
      { key: 'site_logo_footer', label: 'Logo — Stopka', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg' },
      { key: 'site_logo_nav', label: 'Logo — Nawigacja (wszystkie strony)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg' },
      { key: 'site_logo_hero', label: 'Logo — Hero (strona główna)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg' },
      { key: 'site_logo_slogan_white', label: 'Logo — Slogan biały (hero podstron)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/5f809f16-726f-4e78-9150-591a36aa9ee5_sportowy_vibeslogan_white.svg' },
      { key: 'youtube_section_logo', label: 'Logo — Sekcja YouTube', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/5f809f16-726f-4e78-9150-591a36aa9ee5_sportowy_vibeslogan_white.svg' },
      { key: 'filmy_hero_logo', label: 'Logo — Hero (Nasze filmy)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg' },
    ],
  },
  {
    group: 'Tła i zdjęcia hero',
    icon: 'ri-landscape-line',
    keys: [
      { key: 'home_hero_background_video', label: 'Tło hero — Strona główna (wideo .mp4 lub obrazek)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/8591e705-6a36-47f4-847f-1d8b764f605d_sekcja_hero.mp4' },
      { key: 'harmonogram_hero_bg', label: 'Tło hero — Harmonogram kanału', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6e6b2fe0-150e-416f-b4db-9fc01f3d082c_compressed_Gemini_Generated_Image_vne990vne990vne9.webp' },
      { key: 'aktualnosci_hero_bg', label: 'Tło hero — Aktualności', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/3ee7a9de-cf70-4104-8b34-d2e630ef65a4_compressed_Gemini_Generated_Image_tzbsdrtzbsdrtzbs.webp' },
      { key: 'nasz_kanal_hero_mockup', label: 'Zdjęcie hero — Nasz Kanał (laptop)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/a78fdebf-1ca4-456c-82fe-d1ace8668290_compressed_modern-laptop-mockup-with-airpods.webp' },
    ],
  },
  {
    group: 'Ikony dyscyplin — Nawigacja',
    icon: 'ri-compass-3-line',
    keys: [
      { key: 'nav_icon_tennis', label: 'Nav — Tenis', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/ccb0fd5b-5782-49b3-8ca8-adb4a831211d_tennis_racquet_icon_126044.svg' },
      { key: 'nav_icon_volleyball', label: 'Nav — Siatkówka', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6f58c12e-6b36-4c6d-a0d3-83fa6ad87017_volleyball-2.svg' },
      { key: 'nav_icon_football', label: 'Nav — Piłka nożna', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/d756def3-a061-4b62-a00c-2fec9ef47c2f_football.svg' },
      { key: 'nav_icon_basketball', label: 'Nav — Koszykówka', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/fb9e341c-57b4-4dd3-9010-e638ee9af8be_basketball.svg' },
      { key: 'nav_icon_hockey', label: 'Nav — Hokej', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/e7782d89-a2ea-4c35-a175-56026cb0f6d5_hockey.svg' },
      { key: 'nav_icon_ski_jumping', label: 'Nav — Skoki narciarskie', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/1db633d3-afda-4235-9391-71404d847f06_ski_jumper.svg' },
      { key: 'nav_icon_other', label: 'Nav — Inne dyscypliny', fallbackSrc: '' },
      { key: 'nav_icon_our_channel', label: 'Nav — Nasz Kanał', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony menu — O nas',
    icon: 'ri-team-line',
    keys: [
      { key: 'nav_icon_creators', label: 'Nav — Twórcy', fallbackSrc: '' },
      { key: 'nav_icon_history', label: 'Nav — Historia', fallbackSrc: '' },
      { key: 'nav_icon_moderators', label: 'Nav — Moderatorzy', fallbackSrc: '' },
      { key: 'nav_icon_stats', label: 'Nav — Statystyki', fallbackSrc: '' },
      { key: 'nav_icon_cooperation', label: 'Nav — Współpraca', fallbackSrc: '' },
      { key: 'nav_icon_booking', label: 'Nav — Rezerwacja', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony menu — Regulaminy',
    icon: 'ri-file-list-3-line',
    keys: [
      { key: 'nav_icon_privacy', label: 'Nav — Polityka prywatności', fallbackSrc: '' },
      { key: 'nav_icon_terms', label: 'Nav — Regulamin serwisu', fallbackSrc: '' },
      { key: 'nav_icon_rodo', label: 'Nav — RODO', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony menu — Pozostałe (Nawigacja)',
    icon: 'ri-menu-line',
    keys: [
      { key: 'nav_icon_all_news', label: 'Nav — Wszystkie aktualności', fallbackSrc: '' },
      { key: 'nav_icon_home', label: 'Nav — Strona główna (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_news_section', label: 'Nav — Sekcja Aktualności (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_about_section', label: 'Nav — Sekcja O nas (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_certification', label: 'Nav — Certyfikacja (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_contact', label: 'Nav — Kontakt (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_regulations_section', label: 'Nav — Sekcja Regulaminy (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_fan_zone', label: 'Nav — Strefa Kibica (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_settings', label: 'Nav — Ustawienia (mobile)', fallbackSrc: '' },
      { key: 'nav_icon_login', label: 'Nav — Zaloguj się (mobile)', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — TopBar',
    icon: 'ri-timer-line',
    keys: [
      { key: 'topbar_icon_time', label: 'TopBar — Zegar', fallbackSrc: '' },
      { key: 'topbar_icon_weather', label: 'TopBar — Pogoda', fallbackSrc: '' },
      { key: 'topbar_icon_login', label: 'TopBar — Zaloguj się', fallbackSrc: '' },
      { key: 'topbar_icon_fan_zone', label: 'TopBar — Strefa Kibica', fallbackSrc: '' },
      { key: 'topbar_icon_settings', label: 'TopBar — Ustawienia konta', fallbackSrc: '' },
      { key: 'topbar_icon_logout', label: 'TopBar — Wyloguj', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony sekcji — Strona główna',
    icon: 'ri-home-heart-line',
    keys: [
      { key: 'home_icon_hero', label: 'Home — Hero badge', fallbackSrc: '' },
      { key: 'home_icon_about', label: 'Home — O nas badge', fallbackSrc: '' },
      { key: 'home_icon_stats', label: 'Home — Statystyki badge', fallbackSrc: '' },
      { key: 'home_icon_goals', label: 'Home — Cele badge', fallbackSrc: '' },
      { key: 'home_icon_formats', label: 'Home — Formatów badge', fallbackSrc: '' },
      { key: 'home_icon_news', label: 'Home — Aktualności badge', fallbackSrc: '' },
      { key: 'home_icon_partners', label: 'Home — Partnerzy badge', fallbackSrc: '' },
      { key: 'home_icon_contact', label: 'Home — Kontakt badge', fallbackSrc: '' },
      { key: 'home_icon_timeline', label: 'Home — Timeline badge', fallbackSrc: '' },
      { key: 'home_icon_basketball', label: 'Home — Koszykówka badge', fallbackSrc: '' },
      { key: 'home_icon_certyfikacja', label: 'Home — Certyfikacja badge', fallbackSrc: '' },
      { key: 'home_icon_youtube', label: 'Home — YouTube badge', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony dyscyplin',
    icon: 'ri-football-line',
    keys: [
      { key: 'discipline_icon_tenis', label: 'Ikona — Tenis', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/ccb0fd5b-5782-49b3-8ca8-adb4a831211d_tennis_racquet_icon_126044.svg' },
      { key: 'discipline_icon_siatkowka', label: 'Ikona — Siatkówka', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6f58c12e-6b36-4c6d-a0d3-83fa6ad87017_volleyball-2.svg' },
      { key: 'discipline_icon_koszykowka', label: 'Ikona — Koszykówka', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/fb9e341c-57b4-4dd3-9010-e638ee9af8be_basketball.svg' },
      { key: 'discipline_icon_pilka-nozna', label: 'Ikona — Piłka nożna', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/d756def3-a061-4b62-a00c-2fec9ef47c2f_football.svg' },
      { key: 'discipline_icon_hokej', label: 'Ikona — Hokej', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/e7782d89-a2ea-4c35-a175-56026cb0f6d5_hockey.svg' },
      { key: 'discipline_icon_skoki-narciarskie', label: 'Ikona — Skoki narciarskie', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/1db633d3-afda-4235-9391-71404d847f06_ski_jumper.svg' },
    ],
  },
  {
    group: 'Strona główna — Zdjęcia',
    icon: 'ri-home-heart-line',
    keys: [
      { key: 'basketball_img_court', label: 'Boisko koszykówki (BasketballSection)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/54d2f0f0-c050-4cfd-874b-3dbfb0c34c88_Gemini_Generated_Image_elmj04elmj04elmj.png' },
      { key: 'certyfikacja_img_stadium', label: 'Stadion (Certyfikacja)', fallbackSrc: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/71fe57a0-b3c1-4d5a-b325-1a7520d4ab17_Gemini_Generated_Image_6bcnr56bcnr56bcn.webp' },
      { key: 'home_cert_certificate', label: 'Certyfikat (3D — strona główna)', fallbackSrc: '' },
    ],
  },
  {
    group: 'Twórcy',
    icon: 'ri-team-line',
    keys: [
      { key: 'tworcy_img_michal', label: 'Zdjęcie — Michał', fallbackSrc: '' },
      { key: 'tworcy_img_robert', label: 'Zdjęcie — Robert', fallbackSrc: '' },
    ],
  },
  {
    group: 'Formaty (dynamiczne)',
    icon: 'ri-stack-line',
    keys: [
      { key: 'formats_img_red', label: 'Format — Czerwony', fallbackSrc: '' },
      { key: 'formats_img_blue', label: 'Format — Niebieski', fallbackSrc: '' },
      { key: 'formats_img_green', label: 'Format — Zielony', fallbackSrc: '' },
      { key: 'formats_img_purple', label: 'Format — Fioletowy', fallbackSrc: '' },
      { key: 'formats_img_orange', label: 'Format — Pomarańczowy', fallbackSrc: '' },
      { key: 'formats_img_teal', label: 'Format — Turkusowy', fallbackSrc: '' },
    ],
  },
  {
    group: 'Certyfikacja',
    icon: 'ri-award-line',
    keys: [
      { key: 'cert_hero_certificate', label: 'Certyfikat 3D (str. certyfikacji)', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony przycisków — Strona główna (CTA, zakładki, linki)',
    icon: 'ri-cursor-line',
    keys: [
      { key: 'home_icon_hero_cta_news', label: 'Home — CTA Aktualności', fallbackSrc: '' },
      { key: 'home_icon_hero_cta_community', label: 'Home — CTA Społeczność', fallbackSrc: '' },
      { key: 'home_icon_about_tab_tworcy', label: 'Home — Zakładka Twórcy', fallbackSrc: '' },
      { key: 'home_icon_about_tab_historia', label: 'Home — Zakładka Historia', fallbackSrc: '' },
      { key: 'home_icon_about_cta_tworcy', label: 'Home — CTA Zobacz Twórców', fallbackSrc: '' },
      { key: 'home_icon_about_cta_historia', label: 'Home — CTA Zobacz Historię', fallbackSrc: '' },
      { key: 'home_icon_about_michal_badge', label: 'Home — Odznaka Michał', fallbackSrc: '' },
      { key: 'home_icon_about_robert_badge', label: 'Home — Odznaka Robert', fallbackSrc: '' },
      { key: 'home_icon_news_sports', label: 'Home — Nagłówek dyscypliny', fallbackSrc: '' },
      { key: 'home_icon_news_channel', label: 'Home — Nagłówek kanału', fallbackSrc: '' },
      { key: 'home_icon_news_cta_all', label: 'Home — CTA Wszystkie aktualności', fallbackSrc: '' },
      { key: 'home_icon_stats_show_more', label: 'Home — Pokaż więcej (statystyki)', fallbackSrc: '' },
      { key: 'home_icon_stats_show_less', label: 'Home — Pokaż mniej (statystyki)', fallbackSrc: '' },
      { key: 'home_icon_youtube_tab_film', label: 'Home — Zakładka Filmy', fallbackSrc: '' },
      { key: 'home_icon_youtube_tab_shorts', label: 'Home — Zakładka Shorts', fallbackSrc: '' },
      { key: 'home_icon_youtube_tab_live', label: 'Home — Zakładka Live', fallbackSrc: '' },
      { key: 'home_icon_youtube_subscribe', label: 'Home — Subskrybuj YouTube', fallbackSrc: '' },
      { key: 'home_icon_youtube_cta_more', label: 'Home — CTA Zobacz więcej filmów', fallbackSrc: '' },
      { key: 'home_icon_youtube_cta_more_arrow', label: 'Home — CTA Zobacz więcej (strzałka)', fallbackSrc: '' },
      { key: 'home_icon_certyfikacja_cta', label: 'Home — CTA Certyfikacja', fallbackSrc: '' },
      { key: 'home_icon_partners_show_more', label: 'Home — Pokaż więcej (partnerzy)', fallbackSrc: '' },
      { key: 'home_icon_partners_show_less', label: 'Home — Pokaż mniej (partnerzy)', fallbackSrc: '' },
      { key: 'home_icon_partners_cta', label: 'Home — CTA Współpraca', fallbackSrc: '' },
      { key: 'home_icon_contact_business', label: 'Home — Ikona biznes', fallbackSrc: '' },
      { key: 'home_icon_contact_tech', label: 'Home — Ikona techniczny', fallbackSrc: '' },
      { key: 'home_icon_contact_ai', label: 'Home — Ikona AI asystent', fallbackSrc: '' },
      { key: 'home_icon_contact_ai_cta', label: 'Home — CTA AI asystent', fallbackSrc: '' },
      { key: 'home_icon_contact_social_yt', label: 'Home — Social YouTube', fallbackSrc: '' },
      { key: 'home_icon_contact_social_fb', label: 'Home — Social Facebook', fallbackSrc: '' },
      { key: 'home_icon_contact_social_twitch', label: 'Home — Social Twitch', fallbackSrc: '' },
      { key: 'home_icon_contact_submit', label: 'Home — Wyślij formularz', fallbackSrc: '' },
      { key: 'home_icon_contact_consent_shield', label: 'Home — Tarcza zgody', fallbackSrc: '' },
      { key: 'home_icon_navbar_cta', label: 'Home — CTA Navbar (Napisz do nas)', fallbackSrc: '' },
      { key: 'home_icon_navbar_admin', label: 'Home — Admin button', fallbackSrc: '' },
      { key: 'home_icon_goals_user_add_line', label: 'Home — Cel: subskrybenci', fallbackSrc: '' },
      { key: 'home_icon_goals_eye_line', label: 'Home — Cel: wyświetlenia', fallbackSrc: '' },
      { key: 'home_icon_goals_medal_line', label: 'Home — Cel: srebrny przycisk', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony menu — Nawigacja (pozostałe) — KOLORY',
    icon: 'ri-palette-line',
    keys: [
      { key: 'nav_color_tennis', label: 'Kolor — Nav Tenis', fallbackSrc: '' },
      { key: 'nav_color_volleyball', label: 'Kolor — Nav Siatkówka', fallbackSrc: '' },
      { key: 'nav_color_football', label: 'Kolor — Nav Piłka nożna', fallbackSrc: '' },
      { key: 'nav_color_basketball', label: 'Kolor — Nav Koszykówka', fallbackSrc: '' },
      { key: 'nav_color_hockey', label: 'Kolor — Nav Hokej', fallbackSrc: '' },
      { key: 'nav_color_ski_jumping', label: 'Kolor — Nav Skoki narciarskie', fallbackSrc: '' },
      { key: 'nav_color_other', label: 'Kolor — Nav Inne', fallbackSrc: '' },
      { key: 'nav_color_our_channel', label: 'Kolor — Nav Nasz Kanał', fallbackSrc: '' },
      { key: 'nav_color_creators', label: 'Kolor — Nav Twórcy', fallbackSrc: '' },
      { key: 'nav_color_history', label: 'Kolor — Nav Historia', fallbackSrc: '' },
      { key: 'nav_color_moderators', label: 'Kolor — Nav Moderatorzy', fallbackSrc: '' },
      { key: 'nav_color_stats', label: 'Kolor — Nav Statystyki', fallbackSrc: '' },
      { key: 'nav_color_cooperation', label: 'Kolor — Nav Współpraca', fallbackSrc: '' },
      { key: 'nav_color_booking', label: 'Kolor — Nav Rezerwacja', fallbackSrc: '' },
      { key: 'nav_color_privacy', label: 'Kolor — Nav Prywatność', fallbackSrc: '' },
      { key: 'nav_color_terms', label: 'Kolor — Nav Regulamin', fallbackSrc: '' },
      { key: 'nav_color_rodo', label: 'Kolor — Nav RODO', fallbackSrc: '' },
      { key: 'nav_color_all_news', label: 'Kolor — Nav Wszystkie aktualności', fallbackSrc: '' },
      { key: 'nav_color_home', label: 'Kolor — Nav Strona główna', fallbackSrc: '' },
      { key: 'nav_color_news_section', label: 'Kolor — Nav Sekcja Aktualności', fallbackSrc: '' },
      { key: 'nav_color_about_section', label: 'Kolor — Nav Sekcja O nas', fallbackSrc: '' },
      { key: 'nav_color_certification', label: 'Kolor — Nav Certyfikacja', fallbackSrc: '' },
      { key: 'nav_color_contact', label: 'Kolor — Nav Kontakt', fallbackSrc: '' },
      { key: 'nav_color_regulations_section', label: 'Kolor — Nav Sekcja Regulaminy', fallbackSrc: '' },
      { key: 'nav_color_fan_zone', label: 'Kolor — Nav Strefa Kibica', fallbackSrc: '' },
      { key: 'nav_color_settings', label: 'Kolor — Nav Ustawienia', fallbackSrc: '' },
      { key: 'nav_color_login', label: 'Kolor — Nav Zaloguj się', fallbackSrc: '' },
    ],
  },
  {
    group: 'Kolory — TopBar',
    icon: 'ri-palette-line',
    keys: [
      { key: 'topbar_color_time', label: 'Kolor — TopBar Zegar', fallbackSrc: '' },
      { key: 'topbar_color_weather', label: 'Kolor — TopBar Pogoda', fallbackSrc: '' },
      { key: 'topbar_color_login', label: 'Kolor — TopBar Zaloguj się', fallbackSrc: '' },
      { key: 'topbar_color_fan_zone', label: 'Kolor — TopBar Strefa Kibica', fallbackSrc: '' },
      { key: 'topbar_color_settings', label: 'Kolor — TopBar Ustawienia', fallbackSrc: '' },
      { key: 'topbar_color_logout', label: 'Kolor — TopBar Wyloguj', fallbackSrc: '' },
      { key: 'home_color_icon_hero', label: 'Kolor — Home Hero badge', fallbackSrc: '' },
      { key: 'home_color_icon_about', label: 'Kolor — Home O nas badge', fallbackSrc: '' },
      { key: 'home_color_icon_stats', label: 'Kolor — Home Statystyki badge', fallbackSrc: '' },
      { key: 'home_color_icon_goals', label: 'Kolor — Home Cele badge', fallbackSrc: '' },
      { key: 'home_color_icon_formats', label: 'Kolor — Home Formaty badge', fallbackSrc: '' },
      { key: 'home_color_icon_news', label: 'Kolor — Home Aktualności badge', fallbackSrc: '' },
      { key: 'home_color_icon_partners', label: 'Kolor — Home Partnerzy badge', fallbackSrc: '' },
      { key: 'home_color_icon_contact', label: 'Kolor — Home Kontakt badge', fallbackSrc: '' },
      { key: 'home_color_icon_timeline', label: 'Kolor — Home Timeline badge', fallbackSrc: '' },
      { key: 'home_color_icon_basketball', label: 'Kolor — Home Koszykówka badge', fallbackSrc: '' },
      { key: 'home_color_icon_certyfikacja', label: 'Kolor — Home Certyfikacja badge', fallbackSrc: '' },
      { key: 'home_color_icon_youtube', label: 'Kolor — Home YouTube badge', fallbackSrc: '' },
    ],
  },
  {
    group: 'Kolory — Przyciski (Strona główna)',
    icon: 'ri-palette-line',
    keys: [
      { key: 'home_color_icon_hero_cta_news', label: 'Kolor — Hero CTA Aktualności', fallbackSrc: '' },
      { key: 'home_color_icon_hero_cta_community', label: 'Kolor — Hero CTA Społeczność', fallbackSrc: '' },
      { key: 'home_color_icon_about_tab_tworcy', label: 'Kolor — Zakładka Twórcy', fallbackSrc: '' },
      { key: 'home_color_icon_about_tab_historia', label: 'Kolor — Zakładka Historia', fallbackSrc: '' },
      { key: 'home_color_icon_about_cta_tworcy', label: 'Kolor — CTA Twórcy', fallbackSrc: '' },
      { key: 'home_color_icon_about_cta_historia', label: 'Kolor — CTA Historia', fallbackSrc: '' },
      { key: 'home_color_icon_about_michal_badge', label: 'Kolor — Odznaka Michał', fallbackSrc: '' },
      { key: 'home_color_icon_about_robert_badge', label: 'Kolor — Odznaka Robert', fallbackSrc: '' },
      { key: 'home_color_icon_news_sports', label: 'Kolor — Nagłówek dyscypliny', fallbackSrc: '' },
      { key: 'home_color_icon_news_channel', label: 'Kolor — Nagłówek kanału', fallbackSrc: '' },
      { key: 'home_color_icon_news_cta_all', label: 'Kolor — CTA Aktualności', fallbackSrc: '' },
      { key: 'home_color_icon_stats_show_more', label: 'Kolor — Pokaż więcej statystyki', fallbackSrc: '' },
      { key: 'home_color_icon_stats_show_less', label: 'Kolor — Pokaż mniej statystyki', fallbackSrc: '' },
      { key: 'home_color_icon_youtube_tab_film', label: 'Kolor — Zakładka Filmy', fallbackSrc: '' },
      { key: 'home_color_icon_youtube_tab_shorts', label: 'Kolor — Zakładka Shorts', fallbackSrc: '' },
      { key: 'home_color_icon_youtube_tab_live', label: 'Kolor — Zakładka Live', fallbackSrc: '' },
      { key: 'home_color_icon_youtube_subscribe', label: 'Kolor — Subskrybuj YT', fallbackSrc: '' },
      { key: 'home_color_icon_youtube_cta_more', label: 'Kolor — CTA Filmy', fallbackSrc: '' },
      { key: 'home_color_icon_youtube_cta_more_arrow', label: 'Kolor — CTA Filmy strzałka', fallbackSrc: '' },
      { key: 'home_color_icon_certyfikacja_cta', label: 'Kolor — CTA Certyfikacja', fallbackSrc: '' },
      { key: 'home_color_icon_partners_show_more', label: 'Kolor — Pokaż więcej partnerzy', fallbackSrc: '' },
      { key: 'home_color_icon_partners_show_less', label: 'Kolor — Pokaż mniej partnerzy', fallbackSrc: '' },
      { key: 'home_color_icon_partners_cta', label: 'Kolor — CTA Współpraca', fallbackSrc: '' },
      { key: 'home_color_icon_contact_business', label: 'Kolor — Ikona biznes', fallbackSrc: '' },
      { key: 'home_color_icon_contact_tech', label: 'Kolor — Ikona techniczny', fallbackSrc: '' },
      { key: 'home_color_icon_contact_ai', label: 'Kolor — Ikona AI', fallbackSrc: '' },
      { key: 'home_color_icon_contact_ai_cta', label: 'Kolor — CTA AI', fallbackSrc: '' },
      { key: 'home_color_icon_contact_social_yt', label: 'Kolor — Social YT', fallbackSrc: '' },
      { key: 'home_color_icon_contact_social_fb', label: 'Kolor — Social FB', fallbackSrc: '' },
      { key: 'home_color_icon_contact_social_twitch', label: 'Kolor — Social Twitch', fallbackSrc: '' },
      { key: 'home_color_icon_contact_submit', label: 'Kolor — Wyślij formularz', fallbackSrc: '' },
      { key: 'home_color_icon_contact_consent_shield', label: 'Kolor — Tarcza zgody', fallbackSrc: '' },
      { key: 'home_color_icon_navbar_cta', label: 'Kolor — Navbar CTA', fallbackSrc: '' },
      { key: 'home_color_icon_navbar_admin', label: 'Kolor — Admin button', fallbackSrc: '' },
      { key: 'home_color_icon_goals_user_add_line', label: 'Kolor — Cel subskrybenci', fallbackSrc: '' },
      { key: 'home_color_icon_goals_eye_line', label: 'Kolor — Cel wyświetlenia', fallbackSrc: '' },
      { key: 'home_color_icon_goals_medal_line', label: 'Kolor — Cel srebrny', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — Podstrony (Aktualności)',
    icon: 'ri-newspaper-line',
    keys: [
      { key: 'aktualnosci_icon_disciplines', label: 'Aktualności — Ikona dyscyplin', fallbackSrc: '' },
      { key: 'aktualnosci_icon_channel', label: 'Aktualności — Ikona kanału', fallbackSrc: '' },
      { key: 'aktualnosci_icon_mail', label: 'Aktualności — Ikona mail (CTA)', fallbackSrc: '' },
      { key: 'aktualnosci_icon_youtube', label: 'Aktualności — Ikona YouTube (CTA)', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — Podstrony (Dyscyplina)',
    icon: 'ri-grid-line',
    keys: [
      { key: 'dyscyplina_icon_grid_default', label: 'Dyscyplina — Ikona siatki artykułów', fallbackSrc: '' },
      { key: 'dyscyplina_icon_archive_default', label: 'Dyscyplina — Ikona archiwum', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — O nas (strona główna)',
    icon: 'ri-team-line',
    keys: [
      { key: 'onas_icon_hero', label: 'O nas — Ikona hero', fallbackSrc: '' },
      { key: 'onas_icon_creators', label: 'O nas — Ikona Twórcy', fallbackSrc: '' },
      { key: 'onas_icon_history', label: 'O nas — Ikona Historia', fallbackSrc: '' },
      { key: 'onas_icon_moderators', label: 'O nas — Ikona Moderatorzy', fallbackSrc: '' },
      { key: 'onas_icon_cooperation', label: 'O nas — Ikona Współpraca', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — Twórcy',
    icon: 'ri-team-line',
    keys: [
      { key: 'tworcy_icon_hero', label: 'Twórcy — Ikona hero', fallbackSrc: '' },
      { key: 'tworcy_icon_tab_creators', label: 'Twórcy — Ikona zakładki Twórcy', fallbackSrc: '' },
      { key: 'tworcy_icon_tab_history', label: 'Twórcy — Ikona zakładki Historia', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — Historia',
    icon: 'ri-road-map-line',
    keys: [
      { key: 'historia_icon_hero', label: 'Historia — Ikona hero', fallbackSrc: '' },
      { key: 'historia_icon_tab_creators', label: 'Historia — Ikona zakładki Twórcy', fallbackSrc: '' },
      { key: 'historia_icon_tab_history', label: 'Historia — Ikona zakładki Historia', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — Moderatorzy',
    icon: 'ri-shield-star-line',
    keys: [
      { key: 'moderatorzy_icon_hero', label: 'Moderatorzy — Ikona hero', fallbackSrc: '' },
      { key: 'moderatorzy_icon_tab_creators', label: 'Moderatorzy — Ikona zakładki Twórcy', fallbackSrc: '' },
      { key: 'moderatorzy_icon_tab_history', label: 'Moderatorzy — Ikona zakładki Historia', fallbackSrc: '' },
      { key: 'moderatorzy_icon_tab_moderators', label: 'Moderatorzy — Ikona zakładki Moderatorzy', fallbackSrc: '' },
      { key: 'moderatorzy_icon_tab_cooperation', label: 'Moderatorzy — Ikona zakładki Współpraca', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — Współpraca',
    icon: 'ri-service-line',
    keys: [
      { key: 'wspolpraca_icon_hero', label: 'Współpraca — Ikona hero', fallbackSrc: '' },
      { key: 'wspolpraca_icon_tab_creators', label: 'Współpraca — Ikona zakładki Twórcy', fallbackSrc: '' },
      { key: 'wspolpraca_icon_tab_history', label: 'Współpraca — Ikona zakładki Historia', fallbackSrc: '' },
      { key: 'wspolpraca_icon_tab_cooperation', label: 'Współpraca — Ikona zakładki Współpraca', fallbackSrc: '' },
      { key: 'wspolpraca_icon_booking', label: 'Współpraca — Ikona sekcji rezerwacji', fallbackSrc: '' },
      { key: 'wspolpraca_icon_form', label: 'Współpraca — Ikona sekcji formularza', fallbackSrc: '' },
    ],
  },
  {
    group: 'Ikony — Certyfikacja (pozostałe)',
    icon: 'ri-award-line',
    keys: [
      { key: 'cert_icon_hero', label: 'Certyfikacja — Ikona hero', fallbackSrc: '' },
      { key: 'cert_icon_process', label: 'Certyfikacja — Ikona procesu', fallbackSrc: '' },
      { key: 'cert_icon_step_1', label: 'Certyfikacja — Krok 1', fallbackSrc: '' },
      { key: 'cert_icon_step_2', label: 'Certyfikacja — Krok 2', fallbackSrc: '' },
      { key: 'cert_icon_step_3', label: 'Certyfikacja — Krok 3', fallbackSrc: '' },
      { key: 'cert_icon_step_4', label: 'Certyfikacja — Krok 4', fallbackSrc: '' },
      { key: 'cert_icon_step_5', label: 'Certyfikacja — Krok 5', fallbackSrc: '' },
      { key: 'cert_icon_step_6', label: 'Certyfikacja — Krok 6', fallbackSrc: '' },
      { key: 'cert_icon_step_7', label: 'Certyfikacja — Krok 7', fallbackSrc: '' },
      { key: 'cert_icon_benefits', label: 'Certyfikacja — Ikona korzyści', fallbackSrc: '' },
      { key: 'cert_icon_benefit_1', label: 'Certyfikacja — Korzyść 1', fallbackSrc: '' },
      { key: 'cert_icon_benefit_2', label: 'Certyfikacja — Korzyść 2', fallbackSrc: '' },
      { key: 'cert_icon_benefit_3', label: 'Certyfikacja — Korzyść 3', fallbackSrc: '' },
      { key: 'cert_icon_benefit_4', label: 'Certyfikacja — Korzyść 4', fallbackSrc: '' },
      { key: 'cert_icon_benefit_5', label: 'Certyfikacja — Korzyść 5', fallbackSrc: '' },
      { key: 'cert_icon_benefit_6', label: 'Certyfikacja — Korzyść 6', fallbackSrc: '' },
      { key: 'cert_icon_faq', label: 'Certyfikacja — Ikona FAQ', fallbackSrc: '' },
      { key: 'cert_icon_cta', label: 'Certyfikacja — Ikona CTA', fallbackSrc: '' },
    ],
  },
];

export default function ImagesManager() {
  const [items, setItems] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetKeyRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllContent();
    setItems(data.filter((i) => i.content_text && i.content_text.length > 0));
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
      setMessage({ type: 'error', text: 'URL obrazka nie może być pusty' });
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
      setMessage({ type: 'error', text: 'Błąd zapisu — odśwież stronę i spróbuj ponownie' });
    }
  };

  const triggerUpload = (key: string) => {
    uploadTargetKeyRef.current = key;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = uploadTargetKeyRef.current;
    if (!file || !key) return;

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Plik jest za duży. Maksymalny rozmiar to 100MB.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingKey(key);
    setMessage(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Nie udało się odczytać pliku'));
        reader.readAsDataURL(file);
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // If current value is from site-images bucket, overwrite it
      const currentItem = getItem(key);
      const currentUrl = currentItem?.content_text || '';
      const existingUrl = currentUrl.includes('/site-images/') ? currentUrl : undefined;

      const resp = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/site-image-upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            imageBase64: base64,
            fileName: file.name,
            contentType: file.type,
            ...(existingUrl ? { existingUrl } : {}),
          }),
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.error) throw new Error(result.error || 'Błąd przesyłania');

      const uploadedUrl = result.url as string;
      const wasOverwritten = result.overwritten === true;

      const ok = await updateContent(key, uploadedUrl);
      if (ok) {
        setMessage({ type: 'success', text: wasOverwritten ? 'Nadpisano i zapisano!' : 'Przesłano i zapisano!' });
        bustContentCache();
        setItems((prev) => {
          const existing = prev.find((i) => i.content_key === key);
          if (existing) return prev.map((i) => (i.content_key === key ? { ...i, content_text: uploadedUrl } : i));
          return [...prev, { id: Date.now(), content_key: key, content_text: uploadedUrl, updated_at: new Date().toISOString() }];
        });
        if (editingKey === key) { setEditingKey(null); setEditValue(''); }
        setTimeout(() => setMessage(null), 2500);
      } else {
        setMessage({ type: 'error', text: 'Plik przesłany, ale nie udało się zapisać URL.' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      setMessage({ type: 'error', text: msg });
    } finally {
      setUploadingKey(null);
      uploadTargetKeyRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = async (key: string) => {
    setSavingKey(key);
    const ok = await updateContent(key, '');
    setSavingKey(null);
    if (ok) {
      setMessage({ type: 'success', text: 'Przywrócono domyślny obrazek' });
      bustContentCache();
      setItems((prev) => prev.filter((i) => i.content_key !== key));
      if (editingKey === key) {
        setEditingKey(null);
        setEditValue('');
      }
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: 'Błąd przywracania — odśwież stronę' });
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

  const filteredGroups = ALL_IMAGE_GROUPS.map((g) => ({
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground-950">
            Wszystkie obrazy na stronie
          </h3>
          <p className="text-xs text-foreground-500 mt-0.5">
            Zarządzaj każdym edytowalnym obrazkiem — logo, ikony dyscyplin, zdjęcia twórców i ilustracje
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-400"></i>
            <input
              type="text"
              placeholder="Szukaj obrazka lub klucza..."
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

      {/* Hidden file input shared by all rows for local-file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFileSelected}
        className="hidden"
      />

      {totalFiltered === 0 ? (
        <div className="text-center py-16">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-foreground-400 mb-3">
            <i className="ri-image-line text-xl"></i>
          </span>
          <p className="text-sm text-foreground-500">
            {filter ? 'Brak wyników dla podanego filtra.' : 'Brak obrazków do zarządzania.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.group);
            const activeCount = group.keys.filter((k) => !!getItem(k.key)?.content_text).length;

            return (
              <div key={group.group} className="rounded-lg border border-background-200/70 bg-background-50 overflow-hidden">
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
                      const currentUrl = item?.content_text || meta.fallbackSrc || '';
                      const isSaving = savingKey === meta.key;

                      return (
                        <div
                          key={meta.key}
                          className={`px-4 py-3 transition-colors ${
                            isEditing ? 'bg-accent-50/40' : 'hover:bg-background-100/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                hasValue ? 'bg-green-500' : 'bg-foreground-300'
                              }`}
                              title={hasValue ? 'Ma nadpisany URL' : 'Używa domyślnego obrazka'}
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

                              {/* Preview thumbnail */}
                              {currentUrl && !isEditing && (
                                <div className="mt-2 mb-2">
                                  <div className="relative h-20 w-40 rounded-md border border-background-200 bg-background-100 overflow-hidden">
                                    <img
                                      src={currentUrl}
                                      alt={meta.label}
                                      className="h-full w-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {isEditing ? (
                                <div>
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, meta.key)}
                                    placeholder="Wklej URL obrazka..."
                                    className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-accent-400"
                                  />
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
                                        Przywróć domyślny
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => triggerUpload(meta.key)}
                                    disabled={isSaving || uploadingKey === meta.key}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                                  >
                                    {uploadingKey === meta.key ? (
                                      <>
                                        <i className="ri-loader-4-line animate-spin text-xs"></i>
                                        Przesyłanie...
                                      </>
                                    ) : (
                                      <>
                                        <i className="ri-upload-cloud-line text-xs"></i>
                                        Prześlij z komputera
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(meta.key)}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-background-200 bg-background-50 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:text-accent-500 hover:border-accent-300 hover:bg-accent-50 transition-colors whitespace-nowrap"
                                  >
                                    <i className={`${hasValue ? 'ri-pencil-line' : 'ri-add-line'} text-xs`}></i>
                                    {hasValue ? 'Zmień URL' : 'Wklej URL'}
                                  </button>
                                  {hasValue && (
                                    <button
                                      type="button"
                                      onClick={() => handleClear(meta.key)}
                                      disabled={isSaving}
                                      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
                                    >
                                      <i className="ri-restart-line text-xs"></i>
                                      Domyślny
                                    </button>
                                  )}
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