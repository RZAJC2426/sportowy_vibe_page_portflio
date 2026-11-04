import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo, useEffect, useState } from 'react';

interface BreadcrumbsProps {
  /** Override the last breadcrumb label (for dynamic pages like /dyscyplina/:slug) */
  currentLabel?: string;
  /** Optional intermediate crumb between Home and current page (e.g. discipline name for article pages) */
  intermediateLabel?: string;
  /** Link for the intermediate crumb */
  intermediateHref?: string;
  /** Make breadcrumbs stick below the navbar when scrolling */
  sticky?: boolean;
}

interface Crumb {
  label: string;
  href?: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  'o-nas': 'breadcrumbs.about',
  'tworcy': 'breadcrumbs.creators',
  'historia': 'breadcrumbs.history',
  'moderatorzy': 'breadcrumbs.moderators',
  'wspolpraca': 'breadcrumbs.cooperation',
  'aktualnosci': 'breadcrumbs.news',
  'nasze-filmy': 'breadcrumbs.our_videos',
  'nasz-kanal': 'breadcrumbs.our_channel',
  'aktualnosc': 'breadcrumbs.channel_news_detail',
  'harmonogram-kanalu': 'breadcrumbs.channel_schedule',
  'certyfikacja': 'breadcrumbs.certification',
  'strefa-kibica': 'breadcrumbs.fan_zone',
  'dyscyplina': 'breadcrumbs.discipline',
  'artykul': 'breadcrumbs.article',
  'ustawienia-konta': 'breadcrumbs.account_settings',
  'polityka-prywatnosci': 'breadcrumbs.privacy_policy',
  'regulamin-serwisu': 'breadcrumbs.terms_of_service',
  'admin': 'breadcrumbs.admin',
};

export default function Breadcrumbs({ currentLabel, intermediateLabel, intermediateHref, sticky }: BreadcrumbsProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in on mount
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const crumbs = useMemo<Crumb[]>(() => {
    const pathname = location.pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) return [];

    const result: Crumb[] = [
      { label: t('breadcrumbs.home'), href: '/' },
    ];

    // Insert intermediate crumb between Home and the current page (e.g. discipline name on article pages)
    if (intermediateLabel) {
      result.push({
        label: intermediateLabel,
        ...(intermediateHref ? { href: intermediateHref } : {}),
      });
    }

    let accumulatedPath = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      accumulatedPath += `/${seg}`;

      const isLast = i === segments.length - 1;

      // Dynamic route segments — skip them, labels come from props
      if (seg === 'dyscyplina' || seg === 'artykul' || seg === 'aktualnosc') {
        continue;
      }

      if (isLast && currentLabel) {
        result.push({ label: currentLabel });
      } else {
        const key = SEGMENT_LABELS[seg];
        if (key) {
          result.push({ label: t(key), href: isLast ? undefined : accumulatedPath });
        } else if (isLast && !currentLabel) {
          result.push({ label: seg.replace(/-/g, ' ') });
        }
      }
    }

    return result;
  }, [location.pathname, params.slug, currentLabel, intermediateLabel, intermediateHref, t]);

  if (crumbs.length <= 1) return null;

  // Build Schema.org BreadcrumbList
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.label,
      ...(crumb.href ? { 'item': `${window.location.origin}${crumb.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <nav
        aria-label="Breadcrumb"
        className={`w-full bg-background-50/95 backdrop-blur-sm border-b border-background-100 transition-all duration-500 ease-out ${sticky ? 'sticky top-16 z-30' : ''} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      >
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-2.5">
          <ol className="flex flex-wrap items-center gap-1 text-xs">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <li key={index} className="flex items-center gap-1">
                  {index > 0 && (
                    <span className="text-foreground-300 select-none mx-0.5">
                      <i className="ri-arrow-right-s-line text-xs"></i>
                    </span>
                  )}
                  {!isLast && crumb.href ? (
                    <Link
                      to={crumb.href}
                      className="text-foreground-500 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap font-medium"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground-900 font-semibold whitespace-nowrap">
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}