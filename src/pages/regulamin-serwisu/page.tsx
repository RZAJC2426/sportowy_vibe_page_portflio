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

export default function TermsOfServicePage() {
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
            name: isPL ? 'Regulamin serwisu' : 'Terms of Service',
            description: isPL
              ? 'Regulamin serwisu Sportowy VIBE — zasady korzystania z platformy, zakładania konta i prawa użytkowników.'
              : 'Sportowy VIBE Terms of Service — platform usage rules, account registration, and user rights.',
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
                <EditableText contentKey="terms_pl_label" fallback="Dokument" as="span" />
              ) : (
                'Document'
              )}
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mb-3">
              {isPL ? (
                <EditableText contentKey="terms_pl_title" fallback="Regulamin serwisu" as="span" />
              ) : (
                'Terms of Service'
              )}
            </h1>
            <p className="text-sm text-foreground-500 leading-relaxed max-w-2xl mx-auto">
              {isPL ? (
                <EditableText contentKey="terms_pl_date" fallback="Data wejścia w życie: 23.07.2026. Ostatnia aktualizacja: 23.07.2026." as="span" />
              ) : (
                'Effective date: 23.07.2026. Last updated: 23.07.2026.'
              )}
            </p>
          </div>

          <div className="space-y-10 md:space-y-12">
            {/* I. Pojęcia ogólne */}
            <article id="section-I">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sI_title" fallback="I. Pojęcia ogólne" as="span" />
                ) : (
                  'I. General Terms'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sI_body"
                fallback={`<ul class="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground-600 leading-relaxed"><li><strong>Regulamin</strong> – niniejszy dokument normujący zasady korzystania z Serwisu.</li><li><strong>Serwis</strong> – platforma internetowa "Sportowy VIBE", dostępna pod adresem <a href="/" class="text-primary-600 hover:underline">https://sportowyvibe.pl/</a></li><li><strong>Usługodawca</strong> – osoba fizyczna "Robert Zając".</li><li><strong>Usługobiorca</strong> – każda osoba fizyczna, która uzyskuje dostęp do Serwisu i korzysta z udostępnianych usług.</li><li><strong>Komunikacja Drogą Elektroniczną</strong> – wszelka wymiana informacji za pośrednictwem poczty elektronicznej (e-mail) i formularzy online dostępnych w Serwisie.</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* II. Postanowienia ogólne */}
            <article id="section-II">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sII_title" fallback="II. Postanowienia ogólne" as="span" />
                ) : (
                  'II. General Provisions'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sII_body"
                fallback={`<ul class="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Regulamin określa zasady działania i użytkowania Serwisu oraz obowiązki i prawa Usługobiorców i Usługodawcy wynikające z korzystania z Serwisu.</li><li>Przedmiotem usług Usługodawcy jest udostępnianie nieodpłatnych funkcjonalności Serwisu, pozwalających Usługobiorcom na dostęp do treści, materiałów audiowizualnych, aplikacji internetowych czy formularzy elektronicznych.</li><li>Wszelkie informacje publikowane w Serwisie (artykuły, wskazówki, materiały poradnikowe) mają charakter ogólny i nie są skierowane do konkretnych Usługobiorców. Usługodawca nie ponosi odpowiedzialności za sposób ich wykorzystania.</li><li>Usługobiorca ponosi pełną odpowiedzialność za stosowanie materiałów dostępnych w Serwisie i korzystanie z nich zgodnie z właściwymi przepisami prawa.</li><li>Usługodawca nie gwarantuje przydatności zamieszczonych w Serwisie materiałów do konkretnych celów.</li><li>Usługodawca nie odpowiada za ewentualne straty czy szkody związane z użytkowaniem Serwisu. Wszelkie działania podejmowane przez Usługobiorcę w Serwisie odbywają się na jego wyłączne ryzyko.</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* III. Warunki używania Serwisu */}
            <article id="section-III">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sIII_title" fallback="III. Warunki używania Serwisu" as="span" />
                ) : (
                  'III. Conditions of Use'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sIII_body"
                fallback={`<ul class="list-disc pl-6 space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Korzystanie z Serwisu jest dobrowolne i nie wiąże się z opłatami.</li><li>Usługobiorcy zobligowani są do zapoznania się z Regulaminem i innymi dokumentami powiązanymi oraz pełnej ich akceptacji, jeśli chcą kontynuować korzystanie z Serwisu.</li><li>Zakazane jest wykorzystywanie danych osobowych pozyskanych za pośrednictwem Serwisu w celach marketingowych bez zgody.</li><li><strong>Wymagania techniczne korzystania z Serwisu:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>urządzenie wyposażone w wyświetlacz umożliwiający obsługę stron WWW,</li><li>dostęp do Internetu,</li><li>przeglądarka internetowa zgodna ze standardami Konsorcjum W3C i obsługująca HTML5,</li><li>włączona obsługa skryptów JavaScript,</li><li>włączona obsługa plików Cookie.</li></ul></li><li>Aby zapewnić bezpieczeństwo wszystkim Usługobiorcom oraz Usługodawcy, zaleca się stosowanie <a href="/" class="text-primary-600 hover:underline">powszechnych zasad bezpieczeństwa w Internecie</a>.</li><li>Zabrania się podejmowania działań, ręcznie lub przy użyciu oprogramowania, które prowadzą do:<ul class="list-disc pl-6 space-y-1 mt-1"><li>dokonania dekompilacji i analizy kodu źródłowego bez pisemnej zgody,</li><li>generowania nadmiernego obciążenia serwera Serwisu bez pisemnej zgody,</li><li>wykrywania luk w zabezpieczeniach i konfiguracji serwera bez pisemnej zgody,</li><li>wgrywania i injekcji jakiegokolwiek szkodliwego kodu, skryptów lub programów,</li><li>prób śledzenia lub kradzieży danych Usługobiorców bądź Usługodawcy,</li><li>ingerowania w działanie Serwisu w sposób uniemożliwiający lub utrudniający korzystanie z niego.</li></ul></li><li>W przypadku wykrycia incydentu Cyberbezpieczeństwa lub naruszenia RODO, należy niezwłocznie poinformować Usługodawcę, aby umożliwić szybką reakcję i zabezpieczenie interesów wszystkich Usługobiorców.</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* IV. Warunki oraz zasady rejestracji */}
            <article id="section-IV">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sIV_title" fallback="IV. Warunki oraz zasady rejestracji" as="span" />
                ) : (
                  'IV. Registration Terms and Conditions'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sIV_body"
                fallback={`<ul class="list-disc pl-6 space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Podstawowe korzystanie z Serwisu nie wymaga rejestracji.</li><li>Pełen dostęp do dodatkowych funkcjonalności Serwisu wymaga posiadania konta i logowania.</li><li>Rejestracja w Serwisie jest dobrowolna i bezpłatna.</li><li>Każdy Usługobiorca może mieć tylko jedno konto w Serwisie.</li><li><strong>Wymagania techniczne do rejestracji konta:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>posiadanie aktywnego adresu e-mail.</li></ul></li><li>Rejestracja oznacza zgodę Usługobiorcy na przetwarzanie jego danych osobowych w zakresie wprowadzonym do Serwisu podczas procesu rejestracji oraz w trakcie późniejszych zmian lub usuwania danych.</li><li>Usługodawca zastrzega sobie prawo do zawieszania lub usuwania kont Usługobiorców, jeśli naruszają oni Regulamin, dopuszczają się działań niezgodnych z prawem lub zasadami współżycia społecznego.</li><li>Usługodawca może w dowolnym momencie modyfikować zakres dostępnych usług w Serwisie, wprowadzać nowe, czasowo je zawieszać lub ograniczać dostęp, według własnego uznania i bez konieczności akceptacji ze strony Usługobiorców.</li><li><strong>Dodatkowe zasady bezpieczeństwa konta:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>Zabronione jest udostępnianie loginu i hasła do konta osobom trzecim.</li><li>Usługodawca nigdy nie prosi Usługobiorcy o hasło do konta.</li></ul></li><li><strong>Usuwanie konta:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>Usługobiorca może w dowolnym momencie usunąć swoje konto w Serwisie.</li><li>Usunięcie konta jest możliwe po zalogowaniu się w panelu użytkownika.</li><li>Usunięcie konta prowadzi do usunięcia danych identyfikacyjnych Usługobiorcy oraz anonimizacji nazwy użytkownika i adresu e-mail.</li></ul></li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* V. Warunki świadczenia usługi Newsletter */}
            <article id="section-V">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sV_title" fallback="V. Warunki świadczenia usługi Newsletter" as="span" />
                ) : (
                  'V. Newsletter Service Terms'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sV_body"
                fallback={`<ul class="list-disc pl-6 space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Usługobiorca nie musi zapisywać się do Newslettera, aby korzystać z podstawowych funkcji Serwisu.</li><li>Subskrypcja Newslettera jest całkowicie dobrowolna i bezpłatna.</li><li><strong>Wymagania techniczne dla usługi Newsletter:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>posiadanie aktywnego adresu e-mail.</li></ul></li><li><strong>Warunki świadczenia usługi Newsletter:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>podanie prawidłowego adresu e-mail w elektronicznym formularzu,</li><li>potwierdzenie subskrypcji poprzez kliknięcie w link aktywacyjny,</li><li>wyrażenie zgody na otrzymywanie wiadomości e-mail.</li></ul></li><li><strong>Zakres usługi Newsletter obejmuje:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>informacje o nowych treściach, wydarzeniach, promocjach w ramach Serwisu,</li><li>informacje o ofertach promocyjnych partnerów Serwisu (wiadomości marketingowe).</li></ul></li><li><strong>Wypisanie się z Newslettera:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>Usługobiorca może w dowolnym momencie zrezygnować z subskrypcji Newslettera.</li><li>W każdym newsletterze zamieszczony jest link rezygnacji.</li><li>Po rezygnacji adres e-mail Usługobiorcy zostaje usunięty z bazy Usługodawcy.</li></ul></li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* VI. Warunki komunikacji i świadczenia pozostałych usług */}
            <article id="section-VI">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sVI_title" fallback="VI. Warunki komunikacji i świadczenia pozostałych usług w Serwisie" as="span" />
                ) : (
                  'VI. Communication and Other Service Terms'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sVI_body"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Serwis udostępnia dodatkowe funkcje i narzędzia interakcji z Serwisem, takie jak:</p><ul class="list-disc pl-6 space-y-1"><li>Formularz kontaktowy</li><li>Komentowania wpisów i artykułów</li><li>System umożliwia rejestrację użytkowników i zakładanie kont</li><li>System umożliwia zapisanie się do newslettera</li></ul><p class="mt-3">Serwis udostępnia również następujące dane kontaktowe:</p><ul class="list-disc pl-6 space-y-1"><li>Formularz kontaktowy</li><li>Telefon kontaktowy</li></ul><p class="mt-3">Wszelkie dane osobowe przekazywane w ramach kontaktu z Usługodawcą są przetwarzane zgodnie z <a href="/polityka-prywatnosci" class="text-primary-600 hover:underline">Polityką Prywatności</a>, stanowiącą integralną część Regulaminu.</p><p class="mt-3"><strong>Warunki publikowania treści przez Usługobiorców w Serwisie:</strong></p><ul class="list-disc pl-6 space-y-1"><li>Zabrania się zamieszczania treści, które obrażają Usługodawcę, innych Usługobiorców czy osoby trzecie.</li><li>Nie można publikować treści tekstowych, graficznych czy audiowizualnych, do których nie posiada się licencji czy zgody autora praw majątkowych.</li><li>Niedozwolone jest dodawanie treści wulgarnych, pornograficznych lub niezgodnych z prawem, a także odnośników do stron zawierających takie materiały.</li><li>Zabrania się publikowania skryptów, programów czy innych plików nadmiernie obciążających serwer lub stwarzających zagrożenie dla bezpieczeństwa, oraz linków do takich zasobów.</li><li>Zakazane jest publikowanie treści marketingowych i reklamujących serwisy, produkty czy usługi komercyjne bez zgody Usługodawcy.</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* VII. Gromadzenie danych o Usługobiorcach */}
            <article id="section-VII">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sVII_title" fallback="VII. Gromadzenie danych o Usługobiorcach" as="span" />
                ) : (
                  'VII. User Data Collection'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sVII_body"
                fallback={`<div class="space-y-4 text-sm md:text-base text-foreground-600 leading-relaxed"><p>Ze względów prawnych i bezpieczeństwa oraz w celu świadczenia usług zgodnie z prawem, Serwis gromadzi i przetwarza wybrane informacje o Usługobiorcach.</p><p>Dla optymalnego działania Serwisu korzystamy z plików cookies, w których mogą być zapisywane anonimowe dane o aktywności Usługobiorcy.</p><p>Szczegółowe informacje dotyczące zakresu i sposobu przetwarzania danych dostępne są w <a href="/rodo" class="text-primary-600 hover:underline">Obowiązku informacyjnym RODO</a> oraz <a href="/polityka-prywatnosci" class="text-primary-600 hover:underline">Polityce Prywatności</a>, stanowiących część Regulaminu.</p><ul class="list-disc pl-6 space-y-4"><li><em>Dane zbierane automatycznie:</em><br>Serwis gromadzi w sposób automatyczny dane techniczne i statystyczne, takie jak:<ul class="list-disc pl-6 space-y-1 mt-1"><li>Adres IP,</li><li>Typ przeglądarki,</li><li>Rozdzielczość ekranu,</li><li>Przybliżona lokalizacja,</li><li>Otwierane podstrony,</li><li>Czas spędzony na konkretnych podstronach,</li><li>Rodzaj systemu operacyjnego,</li><li>Adres poprzedniej podstrony,</li><li>Strona odsyłająca,</li><li>Język przeglądarki,</li><li>Prędkość łącza internetowego,</li><li>Dostawca usług internetowych.</li></ul></li><li><strong>Anonimowe dane demograficzne na podstawie Google Analytics:</strong><ul class="list-disc pl-6 space-y-1 mt-1"><li>Analiza ruchu i statystyk odwiedzin</li></ul></li><li><em>Dane zbierane podczas rejestracji:</em><br>Nazwa użytkownika, imię i nazwisko, adres e-mail.<p class="mt-1">U zalogowanych Usługobiorców (posiadających konto w Serwisie) w plikach cookies mogą być zapisywane informacje powiązane z identyfikatorem konta.</p></li><li><em>Dane zbierane podczas zapisywania do newslettera:</em><br>adres e-mail</li></ul></div>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* VIII. Prawa autorskie */}
            <article id="section-VIII">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sVIII_title" fallback="VIII. Prawa autorskie" as="span" />
                ) : (
                  'VIII. Copyright'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sVIII_body"
                fallback={`<ul class="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Właścicielem Serwisu oraz praw autorskich do jego zawartości jest Usługodawca.</li><li>Wybrane treści zamieszczone w Serwisie chronione są prawami autorskimi innych podmiotów i wykorzystywane na podstawie udzielonych licencji lub licencji darmowych.</li><li>Na podstawie Ustawy z dnia 4 lutego 1994 r. o prawie autorskim zabronione jest kopiowanie, powielanie lub przechowywanie treści i materiałów (teksty, pliki graficzne, wideo, audio) dostępnych w Serwisie bez uzyskania pisemnej zgody właściciela praw.</li><li>Zgodnie z Ustawą z dnia 4 lutego 1994 r. o prawie autorskim, ochronie nie podlegają proste informacje prasowe. Możliwe jest wykorzystywanie zawartych w nich informacji, o ile nie stanowi to kopiowania znaczącej części tekstów bez pozwolenia.</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* IX. Zmiany Regulaminu */}
            <article id="section-IX">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sIX_title" fallback="IX. Zmiany Regulaminu" as="span" />
                ) : (
                  'IX. Changes to the Terms'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sIX_body"
                fallback={`<ul class="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Postanowienia Regulaminu mogą ulec modyfikacji przez Usługodawcę w dowolnym momencie.</li><li>Informacja o zmianie Regulaminu zostanie rozesłana zarejestrowanym Usługobiorcom drogą elektroniczną.</li><li>W przypadku Usługobiorców niezarejestrowanych, zmiany wchodzą w życie natychmiast po ich publikacji w Serwisie.</li><li>W przypadku Usługobiorców zarejestrowanych przed zmianą Regulaminu, nowe postanowienia zaczynają obowiązywać po upływie 7 dni od publikacji.</li><li>Korzystanie z Serwisu po wprowadzeniu zmian w Regulaminie jest równoznaczne z ich pełną akceptacją.</li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>

            {/* X. Postanowienia końcowe */}
            <article id="section-X">
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-900 mb-4">
                {isPL ? (
                  <EditableText contentKey="terms_pl_sX_title" fallback="X. Postanowienia końcowe" as="span" />
                ) : (
                  'X. Final Provisions'
                )}
              </h2>
              <EditableHTML
                contentKey="terms_pl_sX_body"
                fallback={`<ul class="list-disc pl-6 space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed"><li>Usługodawca nie odpowiada w zakresie dozwolonym przez prawo za treści publikowane przez Usługobiorców, w tym za ich rzetelność i legalność.</li><li>Usługodawca dokłada starań, by Serwis działał nieprzerwanie, jednak nie ponosi odpowiedzialności za przerwy wynikłe z przyczyn niezależnych, w tym działania siły wyższej czy zewnętrznego oprogramowania.</li><li>Usługodawca zastrzega sobie prawo do modyfikacji zawartości Serwisu, włączając w to funkcje i treści, w dowolnym czasie bez powiadamiania Usługobiorców.</li><li>Usługodawca może czasowo wyłączyć Serwis w celu przeprowadzenia prac konserwacyjnych, ulepszeń lub w innym uzasadnionym celu.</li><li>Usługodawca zastrzega sobie prawo do trwałego wyłączenia Serwisu bez wcześniejszej notyfikacji.</li><li>Usługodawca może przenieść w części lub w całości prawa i obowiązki związane z Serwisem na inne podmioty, bez konieczności uzyskania zgody Usługobiorców.</li><li>Aktualne i archiwalne wersje Regulaminu dostępne są w Serwisie na tej samej podstronie.</li><li>W sprawach związanych z działalnością Serwisu zaleca się kontaktować z Usługodawcą za pośrednictwem:<ul class="list-disc pl-6 space-y-1 mt-1"><li>formularza kontaktowego w Serwisie,</li><li>wiadomości e-mail: <a href="mailto:kontakt@sportowyvibe.pl" class="text-primary-600 hover:underline">kontakt@sportowyvibe.pl</a>,</li></ul><p class="mt-1">Kontakt dedykowany jest wyłącznie kwestiom związanym z funkcjonowaniem Serwisu.</p></li></ul>`}
                className="text-sm md:text-base text-foreground-600 leading-relaxed"
              />
            </article>
          </div>

          <div className="mt-14 pt-8 border-t border-background-200/60">
            <p className="text-xs text-foreground-400 leading-relaxed text-center">
              {isPL ? (
                <EditableText
                  contentKey="terms_pl_footer"
                  fallback="W razie pytań dotyczących regulaminu, prosimy o kontakt pod adresem kontakt@sportowyvibe.pl"
                  as="span"
                />
              ) : (
                'For any questions regarding the terms of service, please contact us at kontakt@sportowyvibe.pl'
              )}
            </p>
          </div>
        </main>

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
                <Link to="/rodo" className="text-xs font-medium text-foreground-500 hover:text-primary-600 transition-colors whitespace-nowrap">RODO</Link>
                <span className="text-foreground-300 text-xs select-none">|</span>
                <Link to="/regulamin-serwisu" className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap">Regulamin Serwisu</Link>
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