import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import EditableText from '@/components/feature/EditableText';
import EditableHTML from '@/components/feature/EditableHTML';
import TopBar from '@/pages/home/components/TopBar';
import Breadcrumbs from '@/components/feature/Breadcrumbs';

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`scroll-to-top fixed bottom-20 right-6 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg cursor-pointer hover:bg-primary-600 active:scale-90 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'}`}
      aria-label="Przewiń do góry"
      title="Przewiń do góry"
    >
      <i className="ri-arrow-up-line text-lg"></i>
    </button>
  );
}

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation('common');
  const isPL = i18n.language === 'pl';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: isPL ? 'Polityka Prywatności' : 'Privacy Policy',
            description: isPL
              ? 'Polityka prywatności Sportowy VIBE — dowiedz się, jak chronimy Twoje dane osobowe.'
              : 'Sportowy VIBE Privacy Policy — learn how we protect your personal data.',
          }),
        }}
      />

      <div className="min-h-screen bg-background-50">
        <TopBar />
        <div className="border-b border-background-200/60 bg-background-50">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 md:px-6 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line"></i>
              <span>{isPL ? 'Strona główna' : 'Home'}</span>
            </Link>
          </div>
        </div>

        <Breadcrumbs sticky />

        <main className="mx-auto max-w-[900px] px-4 md:px-6 py-10 md:py-14">
          <div className="mb-10 md:mb-14 text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-foreground-400 mb-3">
              {isPL ? (
                <EditableText contentKey="privacy_pl_label" fallback="Dokument" as="span" />
              ) : (
                'Document'
              )}
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mb-3">
              {isPL ? (
                <EditableText contentKey="privacy_pl_title" fallback="Polityka Prywatności" as="span" />
              ) : (
                'Privacy Policy'
              )}
            </h1>
            <p className="text-sm text-foreground-500 leading-relaxed max-w-2xl mx-auto">
              {isPL ? (
                <EditableText contentKey="privacy_pl_date" fallback="Obowiązuje od 23 lipca 2026 r. Ostatnia aktualizacja: 23 lipca 2026 r." as="span" />
              ) : (
                'Effective as of July 23, 2026. Last updated: July 23, 2026.'
              )}
            </p>
          </div>

          <div className="space-y-10 md:space-y-12">
            {/* Intro */}
            <section>
              <EditableHTML
                contentKey="privacy_pl_intro"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Poniższa Polityka Prywatności określa <strong>zasady zapisywania i uzyskiwania dostępu do danych na Urządzeniach Użytkowników</strong> korzystających z Serwisu do celów świadczenia usług drogą elektroniczną przez Administratora oraz <strong>zasady gromadzenia i przetwarzania danych osobowych Użytkowników</strong>, które zostały podane przez nich osobiście i dobrowolnie za pośrednictwem narzędzi dostępnych w Serwisie.</p><p>Poniższa Polityka Prywatności jest integralną częścią <a href="/regulamin-serwisu" class="text-primary-600 hover:underline">Regulaminu Serwisu</a>, który określa zasady, prawa i obowiązki Użytkowników korzystających z Serwisu.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </section>

            {/* §1 Definicje */}
            <article id="section-1">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s1_title" fallback="§1 Definicje" as="span" />
                ) : (
                  '§1 Definitions'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s1_body"
                fallback={`<ul class="list-disc pl-6 space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><li><strong>Serwis</strong> – serwis internetowy "Sportowy VIBE" działający pod adresem <a href="/" class="text-primary-600 hover:underline">https://sportowyvibe.pl/</a></li><li><strong>Serwis zewnętrzny</strong> – serwisy internetowe partnerów, usługodawców lub usługobiorców współpracujących z Administratorem</li><li><strong>Administrator Serwisu / Danych</strong> – osoba fizyczna "Robert Zając"</li><li><strong>Użytkownik</strong> – osoba fizyczna, dla której Administrator świadczy usługi drogą elektroniczną za pośrednictwem Serwisu</li><li><strong>Urządzenie</strong> – elektroniczne urządzenie wraz z oprogramowaniem, za pośrednictwem którego Użytkownik uzyskuje dostęp do Serwisu</li><li><strong>Cookies (ciasteczka)</strong> – dane tekstowe gromadzone w formie plików zamieszczanych na Urządzeniu Użytkownika</li><li><strong>RODO</strong> – Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych)</li><li><strong>Dane osobowe</strong> – oznaczają informacje o zidentyfikowanej lub możliwej do zidentyfikowania osobie fizycznej ("osobie, której dane dotyczą"); możliwa do zidentyfikowania osoba fizyczna to osoba, którą można bezpośrednio lub pośrednio zidentyfikować, w szczególności na podstawie identyfikatora takiego jak imię i nazwisko, numer identyfikacyjny, dane o lokalizacji, identyfikator internetowy lub jeden bądź kilka szczególnych czynników określających fizyczną, fizjologiczną, genetyczną, psychiczną, ekonomiczną, kulturową lub społeczną tożsamość osoby fizycznej</li><li><strong>Przetwarzanie</strong> – oznacza operację lub zestaw operacji wykonywanych na danych osobowych lub zestawach danych osobowych w sposób zautomatyzowany lub niezautomatyzowany, taką jak zbieranie, utrwalanie, organizowanie, porządkowanie, przechowywanie, adaptowanie lub modyfikowanie, pobieranie, przeglądanie, wykorzystywanie, ujawnianie poprzez przesłanie, rozpowszechnianie lub innego rodzaju udostępnianie, dopasowywanie lub łączenie, ograniczenie, usuwanie lub niszczenie</li><li><strong>Ograniczenie przetwarzania</strong> – oznacza oznaczenie przechowywanych danych osobowych w celu ograniczenia ich przyszłego przetwarzania</li><li><strong>Profilowanie</strong> – oznacza dowolną formę zautomatyzowanego przetwarzania danych osobowych, które polega na wykorzystaniu danych osobowych do oceny niektórych czynników osobowych osoby fizycznej, w szczególności do analizy lub prognozy aspektów dotyczących efektów pracy tej osoby fizycznej, jej sytuacji ekonomicznej, zdrowia, osobistych preferencji, zainteresowań, wiarygodności, zachowania, lokalizacji lub przemieszczania się</li><li><strong>Zgoda</strong> – zgoda osoby, której dane dotyczą oznacza dobrowolne, konkretne, świadome i jednoznaczne okazanie woli, którym osoba, której dane dotyczą, w formie oświadczenia lub wyraźnego działania potwierdzającego, przyzwala na przetwarzanie dotyczących jej danych osobowych</li><li><strong>Naruszenie ochrony danych osobowych</strong> – oznacza naruszenie bezpieczeństwa prowadzące do przypadkowego lub niezgodnego z prawem zniszczenia, utraty, zmodyfikowania, nieuprawnionego ujawnienia lub nieuprawnionego dostępu do danych osobowych przesyłanych, przechowywanych lub w inny sposób przetwarzanych</li><li><strong>Pseudonimizacja</strong> – oznacza przetworzenie danych osobowych w taki sposób, by nie można ich było już przypisać konkretnej osobie, której dane dotyczą, bez użycia dodatkowych informacji, pod warunkiem że takie dodatkowe informacje są przechowywane osobno i są objęte środkami technicznymi i organizacyjnymi uniemożliwiającymi ich przypisanie zidentyfikowanej lub możliwej do zidentyfikowania osobie fizycznej</li><li><strong>Anonimizacja</strong> – Anonimizacja danych to nieodwracalny proces operacji na danych, który niszczy / nadpisuje "dane osobowe" uniemożliwiając identyfikację, lub powiązanie danego rekordu z konkretnym użytkownikiem lub osobą fizyczną</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §2 Inspektor Ochrony Danych */}
            <article id="section-2">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s2_title" fallback="§2 Inspektor Ochrony Danych" as="span" />
                ) : (
                  '§2 Data Protection Officer'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s2_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Na podstawie Art. 37 RODO, Administrator nie powołał Inspektora Ochrony Danych.</p><p>W sprawach dotyczących przetwarzania danych należy kontaktować się bezpośrednio z Administratorem.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §3 Rodzaje Plików Cookies */}
            <article id="section-3">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s3_title" fallback="§3 Rodzaje Plików Cookies" as="span" />
                ) : (
                  '§3 Types of Cookies'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s3_body"
                fallback={`<ul class="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground-600 leading-relaxed"><li><strong>Cookies wewnętrzne</strong> – pliki zamieszczane i odczytywane z Urządzenia Użytkownika przez system teleinformatyczny Serwisu</li><li><strong>Cookies zewnętrzne</strong> – pliki zamieszczane i odczytywane z Urządzenia Użytkownika przez systemy teleinformatyczne Serwisów zewnętrznych</li><li><strong>Cookies sesyjne</strong> – pliki zamieszczane i odczytywane podczas jednej sesji danego Urządzenia</li><li><strong>Cookies trwałe</strong> – pliki zamieszczane i odczytywane do momentu ich ręcznego usunięcia</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §4 Bezpieczeństwo składowania danych */}
            <article id="section-4">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s4_title" fallback="§4 Bezpieczeństwo składowania danych" as="span" />
                ) : (
                  '§4 Data Storage Security'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s4_body"
                fallback={`<ul class="list-disc pl-6 space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><li><strong>Mechanizmy składowania i odczytu plików Cookie</strong> – Mechanizmy składowania, odczytu i wymiany danych pomiędzy Plikami Cookies zapisywanymi na Urządzeniu Użytkownika a Serwisem są realizowane poprzez wbudowane mechanizmy przeglądarek internetowych i nie pozwalają na pobieranie innych danych z Urządzenia Użytkownika lub danych innych witryn internetowych, które odwiedzał Użytkownik, w tym danych osobowych ani informacji poufnych. Przeniesienie na Urządzenie Użytkownika wirusów, koni trojańskich oraz innych robaków jest także praktycznie niemożliwe.</li><li><strong>Cookie wewnętrzne</strong> – zastosowane przez Administratora pliki Cookie są bezpieczne dla Urządzeń Użytkowników i nie zawierają skryptów, treści lub informacji mogących zagrażać bezpieczeństwu danych osobowych lub bezpieczeństwu Urządzenia z którego korzysta Użytkownik.</li><li><strong>Cookie zewnętrzne</strong> – Administrator dokonuje wszelkich możliwych działań w celu weryfikacji i doboru partnerów serwisu w kontekście bezpieczeństwa Użytkowników. Administrator do współpracy dobiera znanych, dużych partnerów o globalnym zaufaniu społecznym. Nie posiada on jednak pełnej kontroli nad zawartością plików Cookie pochodzących od zewnętrznych partnerów. Za bezpieczeństwo plików Cookie, ich zawartość oraz zgodne z licencją wykorzystanie przez zainstalowane w serwisie Skrypty, pochodzących z Serwisów zewnętrznych, Administrator nie ponosi odpowiedzialności na tyle na ile pozwala na to prawo. Lista partnerów zamieszczona jest w dalszej części Polityki Prywatności.</li><li><strong>Kontrola plików Cookie</strong><ul class="list-disc pl-6 space-y-1 mt-2"><li>Użytkownik może w dowolnym momencie, samodzielnie zmienić ustawienia dotyczące zapisywania, usuwania oraz dostępu do danych zapisanych plików Cookies przez każdą witrynę internetową</li><li>Informacje o sposobie wyłączenia plików Cookie w najpopularniejszych przeglądarkach komputerowych dostępne są u jednego ze wskazanych dostawców:<ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://support.google.com/accounts/answer/61416?co=GENIE.Platform%3DDesktop&hl=pl" class="text-primary-600 hover:underline">Zarządzanie plikami cookies w przeglądarce <strong>Chrome</strong></a></li><li><a rel="nofollow noopener noreferrer external" href="https://help.opera.com/pl/latest/web-preferences/" class="text-primary-600 hover:underline">Zarządzanie plikami cookies w przeglądarce <strong>Opera</strong></a></li><li><a rel="nofollow noopener noreferrer external" href="https://support.mozilla.org/pl/kb/blokowanie-ciasteczek" class="text-primary-600 hover:underline">Zarządzanie plikami cookies w przeglądarce <strong>FireFox</strong></a></li><li><a rel="nofollow noopener noreferrer external" href="https://support.microsoft.com/pl-pl/help/4027947/microsoft-edge-delete-cookies" class="text-primary-600 hover:underline">Zarządzanie plikami cookies w przeglądarce <strong>Edge</strong></a></li><li><a rel="nofollow noopener noreferrer external" href="https://support.apple.com/pl-pl/guide/safari/sfri11471/mac" class="text-primary-600 hover:underline">Zarządzanie plikami cookies w przeglądarce <strong>Safari</strong></a></li><li><a rel="nofollow noopener noreferrer external" href="https://windows.microsoft.com/pl-pl/internet-explorer/delete-manage-cookies#ie=ie-11" class="text-primary-600 hover:underline">Zarządzanie plikami cookies w przeglądarce <strong>Internet Explorer 11</strong></a></li></ul></li><li>Użytkownik może w dowolnym momencie usunąć wszelkie zapisane do tej pory pliki Cookie korzystając z narzędzi Urządzenia Użytkownika, za pośrednictwem którego Użytkownik korzysta z usług Serwisu.</li></ul></li><li><strong>Zagrożenia po stronie Użytkownika</strong> – Administrator stosuje wszelkie możliwe środki techniczne w celu zapewnienia bezpieczeństwa danych umieszczanych w plikach Cookie. Należy jednak zwrócić uwagę, że zapewnienie bezpieczeństwa tych danych zależy od obu stron w tym działalności Użytkownika. Administrator nie bierze odpowiedzialności za przechwycenie tych danych, podszywanie się pod sesję Użytkownika lub ich usunięcie, na skutek świadomej lub nieświadomej działalności Użytkownika, wirusów, koni trojańskich i innego oprogramowania szpiegującego, którymi może jest lub było zainfekowane Urządzenie Użytkownika. Użytkownicy w celu zabezpieczenia się przed tymi zagrożeniami powinni stosować się do zasad zwiększających ich <a href="/" class="text-primary-600 hover:underline">cyberbezpieczeństwo</a>.</li><li><strong>Przechowywanie danych osobowych</strong> – Administrator zapewnia, że dokonuje wszelkich starań, by przetwarzane dane osobowe wprowadzone dobrowolnie przez Użytkowników były bezpieczne, dostęp do nich był ograniczony i realizowany zgodnie z ich przeznaczeniem i celami przetwarzania. Administrator zapewnia także, że dokonuje wszelkich starań w celu zabezpieczenia posiadanych danych przed ich utratą, poprzez stosowanie odpowiednich zabezpieczeń fizycznych jak i organizacyjnych.</li><li><strong>Przechowywanie haseł</strong> – Administrator oświadcza, że hasła przechowywane są w zaszyfrowanej postaci, używając najnowszych standardów i wytycznych w tym zakresie. Deszyfracja podawanych w Serwisie haseł dostępu do konta jest praktycznie niemożliwa.</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §5 Cele do których wykorzystywane są pliki Cookie */}
            <article id="section-5">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s5_title" fallback="§5 Cele do których wykorzystywane są pliki Cookie" as="span" />
                ) : (
                  '§5 Purposes for which Cookies are used'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s5_body"
                fallback={`<ul class="list-disc pl-6 space-y-1 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Usprawnienie i ułatwienie dostępu do Serwisu</li><li>Personalizacja Serwisu dla Użytkowników</li><li>Umożliwienie Logowania do serwisu</li><li>Marketing, Remarketing w serwisach zewnętrznych</li><li>Usługi serwowania reklam</li><li>Usługi afiliacyjne</li><li>Prowadzenie statystyk (użytkowników, ilości odwiedzin itp.)</li><li>Serwowanie usług multimedialnych</li><li>Świadczenie usług społecznościowych</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §6 Cele przetwarzania danych osobowych */}
            <article id="section-6">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s6_title" fallback="§6 Cele przetwarzania danych osobowych" as="span" />
                ) : (
                  '§6 Purposes of personal data processing'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s6_body"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Dane osobowe dobrowolnie podane przez Użytkowników są przetwarzane w jednym z następujących celów:</p><ul class="list-disc pl-6 space-y-1"><li>Usługi rejestracji i utrzymania konta Użytkownika w Serwisie</li><li>Usługi Newslettera (w tym przesyłania za zgodą treści reklamowych)</li><li>Usługi komentowania / polubienia wpisów bez konieczności rejestracji</li><li>Usługi udostępniania informacji o treści w serwisach społecznościowych</li><li>Komunikacja Administratora z Użytkownikami</li><li>Zapewnienie prawnie uzasadnionego interesu Administratora</li></ul><p class="mt-3">Dane o Użytkownikach gromadzone anonimowo i automatycznie są przetwarzane w jednym z następujących celów:</p><ul class="list-disc pl-6 space-y-1"><li>Prowadzenie statystyk</li><li>Remarketing</li><li>Serwowanie reklam dostosowanych do preferencji Użytkowników</li><li>Obsługi programów afiliacyjnych</li><li>Zapewnienie prawnie uzasadnionego interesu Administratora</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §7 Pliki Cookies Serwisów zewnętrznych */}
            <article id="section-7">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s7_title" fallback="§7 Pliki Cookies Serwisów zewnętrznych" as="span" />
                ) : (
                  '§7 Third-Party Cookies'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s7_body"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Administrator w Serwisie wykorzystuje skrypty javascript i komponenty webowe partnerów, którzy mogą umieszczać własne pliki cookies na Urządzeniu Użytkownika. Pamiętaj, że w ustawieniach swojej przeglądarki możesz sam decydować o dozwolonych plikach cookies jakie mogą być używane przez poszczególne witryny internetowe. Poniżej znajduje się lista partnerów lub ich usług zaimplementowanych w Serwisie, mogących umieszczać pliki cookies:</p><ul class="list-disc pl-6 space-y-3"><li><strong>Usługi multimedialne:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://www.youtube.com/t/terms" class="text-primary-600 hover:underline">YouTube</a></li><li><a rel="nofollow noopener noreferrer external" href="https://vimeo.com/terms" class="text-primary-600 hover:underline">Vimeo</a></li><li><a rel="nofollow noopener noreferrer external" href="https://livestream.com/legal/terms" class="text-primary-600 hover:underline">Livestream</a></li><li><a rel="nofollow noopener noreferrer external" href="https://www.spotify.com/pl/legal/privacy-policy/" class="text-primary-600 hover:underline">Spotify</a></li></ul></li><li><strong>Usługi społecznościowe / łączone:</strong> (Rejestracja, Logowanie, udostępnianie treści, komunikacja, itp.)<ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://twitter.com/en/tos?wcmmode=disabled#intlTerms" class="text-primary-600 hover:underline">Twitter</a></li><li><a rel="nofollow noopener noreferrer external" href="https://www.microsoft.com/en/servicesagreement/" class="text-primary-600 hover:underline">Microsoft</a></li><li><a rel="nofollow noopener noreferrer external" href="https://www.facebook.com/legal/terms" class="text-primary-600 hover:underline">Facebook</a></li><li><a rel="nofollow noopener noreferrer external" href="https://policies.google.com/privacy?hl=pl" class="text-primary-600 hover:underline">Google+</a></li><li><a rel="nofollow noopener noreferrer external" href="https://www.linkedin.com/legal/user-agreement" class="text-primary-600 hover:underline">LinkedIn</a></li></ul></li><li><strong>Usługi udostępniania treści:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://www.whatsapp.com/privacy/?lang=pl" class="text-primary-600 hover:underline">WhatsApp</a></li><li><a rel="nofollow noopener noreferrer external" href="https://help.instagram.com/519522125107875" class="text-primary-600 hover:underline">Instagram</a></li></ul></li><li><strong>Usługi Newslettera:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://mailchimp.com/legal/privacy/" class="text-primary-600 hover:underline">MailChimp</a></li></ul></li><li><strong>Usługi serwowania reklam oraz sieci afiliacyjne:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://policies.google.com/privacy?hl=pl" class="text-primary-600 hover:underline">Google Adsense</a></li><li><a rel="nofollow noopener noreferrer external" href="https://mylead.global/pl/polityka-prywatnosci" class="text-primary-600 hover:underline">MyLead</a></li></ul></li><li><strong>Prowadzenie statystyk:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://policies.google.com/privacy?hl=pl" class="text-primary-600 hover:underline">Google Analytics</a></li><li><a rel="nofollow noopener noreferrer external" href="https://automattic.com/privacy/" class="text-primary-600 hover:underline">WordPress Stats (Automattic Inc.)</a></li></ul></li><li><strong>Usługi inne:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li><a rel="nofollow noopener noreferrer external" href="https://archive.org/about/terms.php" class="text-primary-600 hover:underline">Internet Archive</a></li><li><a rel="nofollow noopener noreferrer external" href="https://www.google.com/intl/en_be/help/terms_maps/" class="text-primary-600 hover:underline">Mapy Google</a></li></ul></li></ul><p>Usługi świadczone przez podmioty trzecie są poza kontrolą Administratora. Podmioty te mogą w każdej chwili zmienić swoje warunki świadczenia usług, polityki prywatności, cel przetwarzania danych oraz sposób wykorzystywania plików cookie.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §8 Rodzaje gromadzonych danych */}
            <article id="section-8">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s8_title" fallback="§8 Rodzaje gromadzonych danych" as="span" />
                ) : (
                  '§8 Types of collected data'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s8_body"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Serwis gromadzi dane o Użytkownikach. Część danych jest gromadzona automatycznie i anonimowo, a część danych to dane osobowe podane dobrowolnie przez Użytkowników w trakcie zapisywania się do poszczególnych usług oferowanych przez Serwis.</p><p><strong>Anonimowe dane gromadzone automatycznie:</strong></p><ul class="list-disc pl-6 space-y-1"><li>Adres IP</li><li>Typ przeglądarki</li><li>Rozdzielczość ekranu</li><li>Przybliżona lokalizacja</li><li>Otwierane podstrony serwisu</li><li>Czas spędzony na odpowiedniej podstronie serwisu</li><li>Rodzaj systemu operacyjnego</li><li>Adres poprzedniej podstrony</li><li>Adres strony odsyłającej</li><li>Język przeglądarki</li><li>Prędkość łącza internetowego</li><li>Dostawca usług internetowych</li></ul><p><strong>Dane gromadzone podczas rejestracji:</strong></p><ul class="list-disc pl-6 space-y-1"><li>Imię / nazwisko / pseudonim</li><li>Login</li><li>Adres e-mail</li><li>Adres IP (zbierane automatycznie)</li></ul><p><strong>Dane gromadzone podczas zapisu do usługi Newsletter:</strong></p><ul class="list-disc pl-6 space-y-1"><li>Imię / nazwisko / pseudonim</li><li>Adres e-mail</li><li>Płeć</li><li>Adres IP (zbierane automatycznie)</li></ul><p><strong>Dane gromadzone podczas wysyłania formularza:</strong></p><ul class="list-disc pl-6 space-y-1"><li>Imię / nazwisko / nazwa firmy</li><li>Adres e-mail</li><li>Płeć</li><li>Adres IP (zbierane automatycznie)</li></ul><p><strong>Dane gromadzone podczas wysyłania zgłoszenia do audytu:</strong></p><ul class="list-disc pl-6 space-y-1"><li>Imię / nazwisko / nazwa firmy</li><li>Adres e-mail</li><li>Numer telefonu</li><li>Nazwa obiektu sportowego i jej adres</li><li>Płeć</li><li>Adres IP (zbierane automatycznie)</li></ul><p><strong>Dane gromadzone podczas dodawania komentarza:</strong></p><ul class="list-disc pl-6 space-y-1"><li>Imię i nazwisko / pseudonim</li><li>Adres e-mail</li><li>Adres www</li><li>Adres IP (zbierane automatycznie)</li></ul><p>Część danych (bez danych identyfikujących) może być przechowywana w plikach cookies. Część danych (bez danych identyfikujących) może być przekazywana do dostawcy usług statystycznych.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* §9 Dostęp do danych osobowych przez podmioty trzecie */}
            <article id="section-9">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4 text-center">
                {isPL ? (
                  <EditableText contentKey="privacy_pl_s9_title" fallback="§9 Dostęp do danych osobowych przez podmioty trzecie" as="span" />
                ) : (
                  '§9 Access to personal data by third parties'
                )}
              </h2>
              <EditableHTML
                contentKey="privacy_pl_s9_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Co do zasady jedynym odbiorcą danych osobowych podawanych przez Użytkowników jest Administrator.</p><p>Przetwarzanie danych może jednak być powierzone innym podmiotom, realizującym usługi na rzecz Administratora w celu utrzymania działalności Serwisu. Podmioty te działają wyłącznie na podstawie umowy powierzenia przetwarzania danych osobowych i zobowiązane są do zachowania najwyższych standardów bezpieczeństwa oraz poufności.</p><p>Do podmiotów, którym mogą być powierzone dane osobowe, należą w szczególności:</p><ul class="list-disc pl-6 space-y-2"><li>Firmy hostingowe i dostawcy usług chmurowych odpowiedzialne za infrastrukturę techniczną Serwisu</li><li>Firmy świadczące usługi w zakresie analizy ruchu i statystyk (np. Google Analytics)</li><li>Firmy świadczące usługi mailingowe i newsletterowe (np. MailChimp)</li><li>Firmy zapewniające wsparcie techniczne i serwisowe IT</li><li>Firmy pośredniczące w płatnościach on-line (w przypadku dokonywania transakcji w Serwisie)</li><li>Firmy księgowe i audytorskie (w zakresie niezbędnym do prowadzenia działalności gospodarczej)</li></ul><p>Administrator nie sprzedaje ani nie udostępnia danych osobowych Użytkowników podmiotom trzecim w celach marketingowych bez wyraźnej zgody Użytkownika.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>
          </div>

          {/* Footer note */}
          <div className="mt-14 pt-8 border-t border-background-200/60">
            <p className="text-xs text-foreground-400 leading-relaxed text-center">
              {isPL ? (
                <EditableText
                  contentKey="privacy_pl_footer"
                  fallback="W razie pytań dotyczących polityki prywatności, prosimy o kontakt pod adresem kontakt@sportowyvibe.pl lub poprzez formularz kontaktowy na stronie."
                  as="span"
                />
              ) : (
                'For any questions regarding the privacy policy, please contact us at kontakt@sportowyvibe.pl or via the contact form on the website.'
              )}
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-background-200/70 bg-background-100">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <Link to="/" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">Strona główna</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/nasze-filmy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">Filmy</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/o-nas/tworcy" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">O nas</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <button type="button" onClick={() => { navigate('/'); setTimeout(() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer">Kontakt</button>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/o-nas/wspolpraca" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">Współpraca</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/rodo" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">RODO</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/regulamin-serwisu" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">Regulamin</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/polityka-prywatnosci" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">Polityka prywatności</Link>
              </nav>
              <div className="flex items-center gap-3">
                <a href="https://www.youtube.com/@sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="YouTube">
                  <span className="flex h-8 w-8 items-center justify-center"><i className="ri-youtube-fill text-lg"></i></span>
                </a>
                <a href="https://www.facebook.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Facebook">
                  <span className="flex h-8 w-8 items-center justify-center"><i className="ri-facebook-fill text-lg"></i></span>
                </a>
                <a href="https://www.instagram.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors" aria-label="Instagram">
                  <span className="flex h-8 w-8 items-center justify-center"><i className="ri-instagram-line text-lg"></i></span>
                </a>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-background-200/70 text-center">
              <p className="text-xs text-foreground-400">
                {isPL ? '© 2025–2026 Sportowy Vibe. Wszelkie prawa zastrzeżone.' : '© 2025–2026 Sportowy Vibe. All rights reserved.'}
              </p>
            </div>
          </div>
        </footer>
        <ScrollToTop />
      </div>
    </>
  );
}