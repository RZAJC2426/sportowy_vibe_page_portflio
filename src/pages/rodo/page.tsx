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

export default function RodoPage() {
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
            name: isPL ? 'Obowiązek informacyjny RODO' : 'GDPR Information Obligation',
            description: isPL
              ? 'Obowiązek informacyjny RODO — Sportowy VIBE. Administrator danych, cele i sposób przetwarzania danych osobowych.'
              : 'GDPR information obligation — Sportowy VIBE. Data controller, purposes and methods of personal data processing.',
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
                <EditableText contentKey="rodo_pl_label" fallback="Dokument prawny" as="span" />
              ) : (
                'Legal Document'
              )}
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mb-3">
              {isPL ? (
                <EditableText contentKey="rodo_pl_title" fallback="Obowiązek informacyjny RODO" as="span" />
              ) : (
                'GDPR Information Obligation'
              )}
            </h1>
            <p className="text-sm text-foreground-500 leading-relaxed max-w-2xl mx-auto">
              {isPL ? (
                <EditableText contentKey="rodo_pl_date" fallback="Obowiązuje od 23 lipca 2026 r. Ostatnia aktualizacja: 23 lipca 2026 r." as="span" />
              ) : (
                'Effective as of July 23, 2026. Last updated: July 23, 2026.'
              )}
            </p>
          </div>

          <div className="space-y-10 md:space-y-12">
            {/* Intro */}
            <section>
              <EditableHTML
                contentKey="rodo_pl_intro"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Poniższa informacja stanowi zwięzłą, zrozumiałą i przejrzystą skrót informacji zamieszczonych w <a href="/polityka-prywatnosci" class="text-primary-600 hover:underline">Polityce Prywatności</a> odnośnie Administratora danych, celu i sposobu przetwarzania danych osobowych oraz Twoich praw w związku z tym przetwarzaniem, w formie wymaganej do spełnienia obowiązku informacyjnego RODO. Szczegóły dotyczące sposobu przetwarzania i podmiotów uczestniczących w tym procesie dostępne są we wskazanej polityce.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </section>

            {/* Kto jest administratorem danych? */}
            <article id="section-admin">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s1_title" fallback="Kto jest administratorem danych?" as="span" />
                ) : (
                  'Who is the data controller?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s1_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Administratorem Danych Osobowych (dalej Administrator) jest <strong>Robert Zając</strong>.</p><p>W sprawach związanych z ochroną danych osobowych oraz realizacją swoich praw możesz skontaktować się pod adresem e-mail: <a href="mailto:kontakt@sportowyvibe.pl" class="text-primary-600 hover:underline">kontakt@sportowyvibe.pl</a>.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Jak można skontaktować się z administratorem danych? */}
            <article id="section-contact">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s2_title" fallback="Jak można skontaktować się z administratorem danych?" as="span" />
                ) : (
                  'How can you contact the data controller?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s2_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Z Administratorem można skontaktować się w jeden z poniższych sposobów:</p><ul class="list-disc pl-6 space-y-2"><li><strong>Adres poczty elektronicznej</strong> – <a href="mailto:kontakt@sportowyvibe.pl" class="text-primary-600 hover:underline">kontakt@sportowyvibe.pl</a></li><li><strong>Formularz kontaktowy</strong> – dostępny pod adresem: <a href="/#kontakt" class="text-primary-600 hover:underline">https://sportowyvibe.pl/#kontakt</a></li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Czy Administrator powołał Inspektora Danych Osobowych? */}
            <article id="section-iod">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s3_title" fallback="Czy Administrator powołał Inspektora Danych Osobowych?" as="span" />
                ) : (
                  'Has the Data Controller appointed a Data Protection Officer?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s3_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Na podstawie Art. 37 RODO, Administrator nie powołał Inspektora Ochrony Danych.</p><p>W sprawach dotyczących przetwarzania danych, w tym danych osobowych, należy kontaktować się bezpośrednio z Administratorem.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Skąd pozyskujemy dane osobowe i jakie są ich źródła? */}
            <article id="section-sources">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s4_title" fallback="Skąd pozyskujemy dane osobowe i jakie są ich źródła?" as="span" />
                ) : (
                  'Where do we obtain personal data from and what are their sources?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s4_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Dane pozyskiwane są z następujących źródeł:</p><ul class="list-disc pl-6 space-y-2"><li>od osób, których dane dotyczą</li><li>w przypadku rejestracji przy użyciu portali społecznościowych, za wyraźną i świadomą zgodą tych osób, z tych portali społecznościowych</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Jaki jest zakres przetwarzanych przez nas danych osobowych? */}
            <article id="section-scope">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s5_title" fallback="Jaki jest zakres przetwarzanych przez nas danych osobowych?" as="span" />
                ) : (
                  'What is the scope of personal data we process?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s5_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>W serwisie przetwarzane są <strong>dane osobowe zwykłe</strong>, podane dobrowolnie przez osoby, których dotyczą (np. imię, nazwisko, login, adres e-mail, telefon, adres IP, itp.).</p><p>Szczegółowy zakres przetwarzanych danych dostępny jest w <a href="/polityka-prywatnosci" class="text-primary-600 hover:underline">Polityce Prywatności</a>.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Jakie są cele przetwarzania przez nas danych? */}
            <article id="section-purposes">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s6_title" fallback="Jakie są cele przetwarzania przez nas danych?" as="span" />
                ) : (
                  'What are the purposes of processing your data?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s6_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Dane osobowe dobrowolnie podane przez Użytkowników są przetwarzane w jednym z następujących celów:</p><ul class="list-disc pl-6 space-y-2"><li>Realizacja usług rejestracji i utrzymania konta Użytkownika</li><li>Usługi Newslettera (w tym przesyłania za zgodą treści reklamowych)</li><li>Usługi komentowania / polubienia wpisów</li><li>Komunikacja Administratora z Użytkownikami w sprawach związanych z Serwisem</li><li>Zapewnienie prawnie uzasadnionego interesu Administratora</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Jakie są podstawy prawne przetwarzania danych? */}
            <article id="section-legal-basis">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s7_title" fallback="Jakie są podstawy prawne przetwarzania danych?" as="span" />
                ) : (
                  'What are the legal bases for data processing?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s7_body"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Serwis gromadzi i przetwarza dane Użytkowników na podstawie:</p><ul class="list-disc pl-6 space-y-3"><li>Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych)<ul class="list-disc pl-6 space-y-1 mt-2"><li>art. 6 ust. 1 lit. a – osoba, której dane dotyczą wyraziła zgodę na przetwarzanie swoich danych osobowych w jednym lub większej liczbie określonych celów</li><li>art. 6 ust. 1 lit. b – przetwarzanie jest niezbędne do wykonania umowy, której stroną jest osoba, której dane dotyczą, lub do podjęcia działań na żądanie osoby, której dane dotyczą, przed zawarciem umowy</li><li>przetwarzanie jest niezbędne do celów wynikających z prawnie uzasadnionych interesów realizowanych przez administratora lub przez stronę trzecią</li></ul></li><li>Ustawa z dnia 10 maja 2018 r. o ochronie danych osobowych (Dz.U. 2018 poz. 1000)</li><li>Ustawa z dnia 16 lipca 2004 r. Prawo telekomunikacyjne (Dz.U. 2004 nr 171 poz. 1800)</li><li>Ustawa z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych (Dz. U. 1994 Nr 24 poz. 83)</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Prawnie uzasadniony interes */}
            <article id="section-legitimate-interest">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s8_title" fallback="Jaki jest prawnie uzasadniony interes realizowany przez Administratora?" as="span" />
                ) : (
                  'What is the legitimate interest pursued by the Controller?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s8_body"
                fallback={`<ul class="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground-600 leading-relaxed"><li>W celu ewentualnego ustalenia, dochodzenia lub obrony przed roszczeniami – podstawą prawną przetwarzania jest nasz uzasadniony interes (art. 6 ust. 1 lit. f) RODO) polegający na ochronie naszych praw</li><li>W celu oceny ryzyka potencjalnych klientów</li><li>W celu oceny planowanych kampanii marketingowych</li><li>W celu realizacji marketingu bezpośredniego</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Przez jaki okres przetwarzamy dane osobowe? */}
            <article id="section-retention">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s9_title" fallback="Przez jaki okres przetwarzamy dane osobowe?" as="span" />
                ) : (
                  'For what period do we process personal data?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s9_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Co do zasady, wskazane dane osobowe są przechowywane wyłącznie przez okres świadczenia usługi w ramach prowadzonego serwisu przez Administratora. Są one usuwane lub anonimizowane w okresie do 30 dni od chwili zakończenia świadczenia usług (np. usunięcie zarejestrowanego konta użytkownika, wypisanie z listy Newsletter, itp.).</p><p>W wyjątkowych sytuacjach, w celu zabezpieczenia prawnie uzasadnionego interesu realizowanego przez Administratora, okres ten może ulec wydłużeniu. W takiej sytuacji Administrator będzie przechowywać wskazane dane, od czasu żądania ich usunięcia przez Użytkownika, nie dłużej niż przez okres 3 lat w przypadku naruszenia lub podejrzenia naruszenia zapisów regulaminu serwisu przez osobę, której dane dotyczą.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Kto jest odbiorcą danych? */}
            <article id="section-recipients">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s10_title" fallback="Kto jest odbiorcą danych w tym danych osobowych?" as="span" />
                ) : (
                  'Who is the recipient of the data including personal data?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s10_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Co do zasady jedynym odbiorcą danych jest Administrator.</p><p>Przetwarzanie danych może jednak być powierzone innym podmiotom, realizującym usługi na rzecz Administratora w celu utrzymania działalności Serwisu.</p><ul class="list-disc pl-6 space-y-2"><li>Firmy hostingowe, świadczące usługi hostingu lub usług pokrewnych dla Administratora</li><li>Firmy, za pośrednictwem których świadczona jest usługa Newslettera</li><li>Firmy serwisowe i wsparcia IT dokonujące konserwacji lub odpowiedzialne za utrzymanie infrastruktury IT</li><li>Firmy pośredniczące w płatnościach on-line za towaru lub usługi oferowane w ramach Serwisu (w przypadku dokonywania transakcji zakupu w Serwisie)</li><li>Firmy pośredniczące w płatnościach mobilnych za towaru lub usługi oferowane w ramach Serwisu (w przypadku dokonywania transakcji zakupu w Serwisie)</li><li>Firmy odpowiedzialne za prowadzenie księgowości Administratora (w przypadku dokonywania transakcji zakupu w Serwisie)</li><li>Firmy odpowiedzialne za dostarczanie produktów fizycznych do Użytkownika (usługi pocztowe / kurierskie w przypadku dokonywania transakcji zakupu w Serwisie)</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Przekazywanie poza UE */}
            <article id="section-transfer">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s11_title" fallback="Czy Państwa dane osobowe będą przekazywane poza Unię Europejską?" as="span" />
                ) : (
                  'Will your personal data be transferred outside the European Union?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s11_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p><strong>Dane osobowe są przekazywane poza Unię Europejską.</strong></p><p>Przekazanie danych poza UE jest spowodowane korzystaniem z usług podmiotów zlokalizowanych poza granicami UE, lub w wyniku opublikowania na skutek indywidualnego działania Użytkownika (np. wprowadzenie komentarza lub wpisu), co sprawi, że dane będą dostępne dla każdej osoby odwiedzającej serwis.</p><p>W przypadku przekazania lub powierzenia przetwarzania danych osobowych poza granicami UE, dane te są przetwarzane na podstawie umowy zawartej pomiędzy Administratorem a Usługodawcą.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Automatyzowane podejmowanie decyzji */}
            <article id="section-automated">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s12_title" fallback="Czy dane osobowe będą podstawą zautomatyzowanego podejmowania decyzji?" as="span" />
                ) : (
                  'Will personal data be the basis for automated decision-making?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s12_body"
                fallback={`<div class="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Dane osobowe <strong>są wykorzystywane do zautomatyzowanego podejmowania decyzji</strong> (profilowania).</p><p>Profilowanie danych osobowych nie wywołuje skutków prawnych lub w podobny sposób istotnie nie wpływa na osobę, której dane podlegają automatycznemu podejmowaniu decyzji.</p></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* Prawa użytkowników */}
            <article id="section-rights">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="rodo_pl_s13_title" fallback="Jakie mają Państwo prawa związane z przetwarzaniem danych osobowych?" as="span" />
                ) : (
                  'What rights do you have regarding the processing of personal data?'
                )}
              </h2>
              <EditableHTML
                contentKey="rodo_pl_s13_body"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><ul class="list-disc pl-6 space-y-4"><li><strong>Prawo dostępu do danych osobowych</strong><br>Użytkownikom przysługuje prawo uzyskania dostępu do swoich danych osobowych, realizowane na żądanie złożone do Administratora.</li><li><strong>Prawo do sprostowania danych osobowych</strong><br>Użytkownikom przysługuje prawo żądania od Administratora niezwłocznego sprostowania danych osobowych, które są nieprawidłowe lub / oraz uzupełnienia niekompletnych danych osobowych, realizowane na żądanie złożone do Administratora.</li><li><strong>Prawo do usunięcia danych osobowych</strong><br>Użytkownikom przysługuje prawo żądania od Administratora niezwłocznego usunięcia danych osobowych. W przypadku kont użytkowników, usunięcie danych polega na anonimizacji danych umożliwiających identyfikację Użytkownika. W przypadku usługi Newsletter, Użytkownik ma możliwość samodzielnego usunięcia swoich danych osobowych korzystając z odnośnika umieszczonego w każdej przesyłanej wiadomości e-mail.</li><li><strong>Prawo do ograniczenia przetwarzania</strong><br>Użytkownikom przysługuje prawo ograniczenia przetwarzania danych osobowych w przypadkach wskazanych w art. 18 RODO, m.in. kwestionowania prawidłowości danych osobowych, realizowane na żądanie złożone do Administratora.</li><li><strong>Prawo do przenoszenia danych osobowych</strong><br>Użytkownikom przysługuje prawo uzyskania od Administratora danych osobowych dotyczących Użytkownika w ustrukturyzowanym, powszechnie używanym formacie nadającym się do odczytu maszynowego, realizowane na żądanie złożone do Administratora.</li><li><strong>Prawo wniesienia sprzeciwu wobec przetwarzania</strong><br>Użytkownikom przysługuje prawo wniesienia sprzeciwu wobec przetwarzania jego danych osobowych w przypadkach określonych w art. 21 RODO, realizowane na żądanie złożone do Administratora.</li><li><strong>Prawo wniesienia skargi</strong><br>Użytkownikom przysługuje prawo wniesienia skargi do organu nadzorczego zajmującego się ochroną danych osobowych.</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>
          </div>

          {/* Footer note */}
          <div className="mt-14 pt-8 border-t border-background-200/60">
            <p className="text-xs text-foreground-400 leading-relaxed text-center">
              {isPL ? (
                <EditableText
                  contentKey="rodo_pl_footer"
                  fallback="W razie pytań dotyczących RODO, prosimy o kontakt pod adresem kontakt@sportowyvibe.pl lub poprzez formularz kontaktowy na stronie."
                  as="span"
                />
              ) : (
                'For any questions regarding GDPR, please contact us at kontakt@sportowyvibe.pl or via the contact form on the website.'
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
                <Link to="/polityka-prywatnosci" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">Polityka prywatności</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/regulamin-serwisu" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">Regulamin</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/rodo" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">RODO</Link>
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