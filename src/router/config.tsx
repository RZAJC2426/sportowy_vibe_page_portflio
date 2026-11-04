import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";

/* ── Code-splitting: strony poza Home i NotFound są ładowane na żądanie ── */
const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background-50">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
      <i className="ri-loader-4-line text-2xl"></i>
    </span>
  </div>
);

const CertyfikacjaPage = lazy(() => import("../pages/certyfikacja/page"));
const AktualnosciPage = lazy(() => import("../pages/aktualnosci/page"));
const NaszeFilmyPage = lazy(() => import("../pages/nasze-filmy/page"));
const DyscyplinaPage = lazy(() => import("../pages/dyscyplina/page"));
const ArtykulPage = lazy(() => import("../pages/artykul/page"));
const NaszKanalPage = lazy(() => import("../pages/nasz-kanal/page"));
const AktualnoscKanaluPage = lazy(() => import("../pages/nasz-kanal/aktualnosc/page"));
const HarmonogramKanaluPage = lazy(() => import("../pages/harmonogram-kanalu/page"));
const TworcyPage = lazy(() => import("../pages/o-nas/tworcy"));
const HistoriaPage = lazy(() => import("../pages/o-nas/historia"));
const WspolpracaPage = lazy(() => import("../pages/o-nas/wspolpraca"));
const ModeratorzyPage = lazy(() => import("../pages/o-nas/moderatorzy"));
const StrefaKibicaPage = lazy(() => import("../pages/strefa-kibica/page"));
const UstawieniaKontaPage = lazy(() => import("../pages/ustawienia-konta/page"));
const AdminPage = lazy(() => import("../pages/admin/page"));
const PrivacyPolicyPage = lazy(() => import("../pages/polityka-prywatnosci/page"));
const TermsOfServicePage = lazy(() => import("../pages/regulamin-serwisu/page"));
const ONasPage = lazy(() => import("../pages/o-nas/page"));
const WeryfikacjaEmailPage = lazy(() => import("../pages/weryfikacja-email/page"));
const ResetHaslaPage = lazy(() => import("../pages/reset-hasla/page"));
const RodoPage = lazy(() => import("../pages/rodo/page"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/certyfikacja",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <CertyfikacjaPage />
      </Suspense>
    ),
  },
  {
    path: "/aktualnosci",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <AktualnosciPage />
      </Suspense>
    ),
  },
  {
    path: "/nasze-filmy",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <NaszeFilmyPage />
      </Suspense>
    ),
  },
  {
    path: "/dyscyplina/:slug",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <DyscyplinaPage />
      </Suspense>
    ),
  },
  {
    path: "/artykul/:slug",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <ArtykulPage />
      </Suspense>
    ),
  },
  {
    path: "/nasz-kanal",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <NaszKanalPage />
      </Suspense>
    ),
  },
  {
    path: "/nasz-kanal/aktualnosc/:id",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <AktualnoscKanaluPage />
      </Suspense>
    ),
  },
  {
    path: "/harmonogram-kanalu",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <HarmonogramKanaluPage />
      </Suspense>
    ),
  },
  {
    path: "/o-nas",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <ONasPage />
      </Suspense>
    ),
  },
  {
    path: "/o-nas/tworcy",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <TworcyPage />
      </Suspense>
    ),
  },
  {
    path: "/o-nas/historia",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <HistoriaPage />
      </Suspense>
    ),
  },
  {
    path: "/o-nas/wspolpraca",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <WspolpracaPage />
      </Suspense>
    ),
  },
  {
    path: "/o-nas/moderatorzy",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <ModeratorzyPage />
      </Suspense>
    ),
  },
  {
    path: "/strefa-kibica",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <StrefaKibicaPage />
      </Suspense>
    ),
  },
  {
    path: "/ustawienia-konta",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <UstawieniaKontaPage />
      </Suspense>
    ),
  },
  {
    path: "/admin",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <AdminPage />
      </Suspense>
    ),
  },
  {
    path: "/polityka-prywatnosci",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <PrivacyPolicyPage />
      </Suspense>
    ),
  },
  {
    path: "/regulamin-serwisu",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <TermsOfServicePage />
      </Suspense>
    ),
  },
  {
    path: "/rodo",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <RodoPage />
      </Suspense>
    ),
  },
  {
    path: "/weryfikacja-email",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <WeryfikacjaEmailPage />
      </Suspense>
    ),
  },
  {
    path: "/reset-hasla",
    element: (
      <Suspense fallback={<PageSpinner />}>
        <ResetHaslaPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;