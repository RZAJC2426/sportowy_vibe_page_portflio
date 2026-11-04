import { lazy, Suspense } from 'react';
import TopBar from './components/TopBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import LazySection from '@/components/feature/LazySection';
import { usePageVisit } from '@/hooks/useLikes';

// --- Eager-loaded (above-fold critical) ---
// Hero, TopBar, Navbar — must be in the initial bundle

// --- Lazy-loaded (below-fold, heavy) ---
const Formats = lazy(() => import('./components/Formats'));
const Stats = lazy(() => import('./components/Stats'));
const YouTubeSection = lazy(() => import('./components/YouTubeSection'));
const Certyfikacja = lazy(() => import('./components/Certyfikacja'));
const Partners = lazy(() => import('./components/Partners'));
const About = lazy(() => import('./components/About'));
const Goals = lazy(() => import('./components/Goals'));
const Contact = lazy(() => import('./components/Contact'));

export default function Home() {
  usePageVisit('/');

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Sportowy Vibe',
            url: 'https://sportowyvibe.pl/',
            logo: 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg',
            description: 'Kanał YouTube tworzony przez Roberta i Michała — sportowa energia każdego dnia. Ekspercka wiedza, pasja i analizy najważniejszych wydarzeń sportowych.',
            foundingDate: '2024-01-01',
            founder: [
              { '@type': 'Person', name: 'Robert' },
              { '@type': 'Person', name: 'Michał' },
            ],
            sameAs: [
              'https://www.youtube.com/@sportowy_vibe',
              'https://www.facebook.com/SportowyVIBE/',
              'https://www.instagram.com/sportowy_vibe',
            ],
            areaServed: {
              '@type': 'Country',
              name: 'Polska',
            },
            knowsAbout: [
              'Piłka Nożna',
              'Koszykówka',
              'Siatkówka',
              'Tenis',
              'Sporty Walki',
              'Lekkoatletyka',
              'Żużel',
              'Hokej na lodzie',
              'Skoki Narciarskie',
            ],
          }),
        }}
      />
      <TopBar />
      <Navbar />
      <main>
        <Hero />
        <LazySection minHeight="300px" rootMargin="200px">
          <Suspense fallback={null}>
            <Formats />
          </Suspense>
        </LazySection>
        <LazySection minHeight="550px">
          <Suspense fallback={null}>
            <YouTubeSection />
          </Suspense>
        </LazySection>
        <LazySection minHeight="600px">
          <Suspense fallback={null}>
            <Certyfikacja />
          </Suspense>
        </LazySection>
        <LazySection minHeight="500px" rootMargin="600px">
          <Suspense fallback={null}>
            <Partners />
          </Suspense>
        </LazySection>
        <LazySection minHeight="450px" rootMargin="600px">
          <Suspense fallback={null}>
            <About />
          </Suspense>
        </LazySection>
        <LazySection minHeight="250px" rootMargin="400px">
          <Suspense fallback={null}>
            <Stats />
          </Suspense>
        </LazySection>
        <LazySection minHeight="400px" rootMargin="600px">
          <Suspense fallback={null}>
            <Goals />
          </Suspense>
        </LazySection>
        <LazySection minHeight="600px" rootMargin="600px">
          <Suspense fallback={null}>
            <Contact />
          </Suspense>
        </LazySection>
      </main>
      <Footer />
    </div>
  );
}