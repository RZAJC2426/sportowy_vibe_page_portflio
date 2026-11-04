import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableIcon from '@/components/feature/EditableIcon';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="border-t border-background-200/60 bg-background-100 py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
          <EditableImage
            contentKey="site_logo_footer"
            fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
            alt="Sportowy VIBE"
            className="h-9 w-auto max-w-[160px] object-contain"
            style={{ filter: 'brightness(0) saturate(100%) invert(30%) sepia(100%) saturate(5000%) hue-rotate(200deg) brightness(100%) contrast(100%)' }}
            width={160}
            height={36}
          />
        </Link>

        <p className="text-xs text-foreground-500 max-w-md text-center">
          <EditableText contentKey="footer_tagline" fallback={t('footer.tagline', 'Energia sportu każdego dnia — śledź nas na YouTube i bądź na bieżąco z najnowszymi analizami.')} />
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-foreground-400">
          <a href="#hero" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_home" fallback={t('nav.home')} />
          </a>
          <span className="text-foreground-300">|</span>
          <a href="#formats" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_movies" fallback={t('footer.movies')} />
          </a>
          <span className="text-foreground-300">|</span>
          <a href="#o-nas" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_about" fallback={t('nav.about')} />
          </a>
          <span className="text-foreground-300">|</span>
          <a href="#kontakt" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_contact" fallback={t('nav.contact')} />
          </a>
          <span className="text-foreground-300">|</span>
          <a href="#wspolpraca" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_cooperation" fallback={t('nav.cooperation')} />
          </a>
          <span className="text-foreground-300">|</span>
          <Link to="/polityka-prywatnosci" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_privacy" fallback={t('footer.privacy')} />
          </Link>
          <span className="text-foreground-300">|</span>
          <Link to="/rodo" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_rodo" fallback="RODO" />
          </Link>
          <span className="text-foreground-300">|</span>
          <Link to="/regulamin-serwisu" className="hover:text-foreground-700 transition-colors cursor-pointer">
            <EditableText contentKey="footer_nav_terms" fallback={t('nav.terms')} />
          </Link>
        </div>

        <div className="flex items-center gap-4 text-foreground-400">
          <a href="https://www.youtube.com/@sportowy_vibe" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors" aria-label="YouTube">
            <EditableIcon contentKey="footer_icon_youtube" fallbackIcon="ri-youtube-fill" className="text-lg" />
          </a>
          <a href="https://www.facebook.com/SportowyVIBE/" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors" aria-label="Facebook">
            <EditableIcon contentKey="footer_icon_facebook" fallbackIcon="ri-facebook-fill" className="text-lg" />
          </a>
          <a href="https://www.instagram.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors" aria-label="Instagram">
            <EditableIcon contentKey="footer_icon_instagram" fallbackIcon="ri-instagram-line" className="text-lg" />
          </a>
        </div>

        <p className="text-xs text-foreground-400">
          <EditableText contentKey="footer_rights" fallback={t('footer.rights')} />
        </p>
      </div>
    </footer>
  );
}