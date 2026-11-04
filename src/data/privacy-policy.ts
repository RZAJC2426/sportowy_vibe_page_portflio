export interface PrivacySection {
  id: string;
  title: string;
  text: string;
}

export interface PrivacyPolicyData {
  title: string;
  sections: PrivacySection[];
}

export const privacyPolicyPL: PrivacyPolicyData = {
  title: 'Polityka prywatności',
  sections: [
    {
      id: 'I',
      title: 'I. Postanowienia ogólne',
      text: `Polityka prywatności określa, jak zbierane, przetwarzane i przechowywane są dane osobowe Użytkowników niezbędne do świadczenia usług drogą elektroniczną za pośrednictwem serwisu internetowego sportowy_vibe.com.pl (dalej: Serwis).
Serwis zbiera wyłącznie dane osobowe niezbędne do świadczenia i rozwoju usług w nim oferowanych.
Dane osobowe zbierane za pośrednictwem Serwisu są przetwarzane zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych, dalej RODO) oraz ustawą o ochronie danych osobowych z dnia 10 maja 2018 r.`,
    },
    {
      id: 'II',
      title: 'II. Administrator danych',
      text: `Administratorem danych osobowych zbieranych poprzez Serwis jest Fundacja Równik Praw z siedzibą we Wrocławiu ul Legnicka 65
54-206 Wrocław, KRS: 0000990331, NIP: 9462720408, REGON: 523032305, adres poczty elektronicznej: kontakt@rownik-praw.org (dalej: Administrator).`,
    },
    {
      id: 'III',
      title: 'III. Cel zbierania danych osobowych',
      text: `Dane osobowe wykorzystywane są w celu:
rejestracji konta i weryfikacji tożsamości Użytkownika,
umożliwienia logowania do Serwisu,
realizacji umowy dotyczącej usług i e-usług,
komunikacji z Użytkownikiem (livechat, formularz kontaktowy itp.)
wysyłki newslettera (po wyrażeniu zgody Użytkownika na jego otrzymywanie),
prowadzenia systemu komentarzy,
świadczenia usług społecznościowych,
promocji oferty Administratora,
marketingu, remarketingu, afiliacji,
personalizacji Serwisu dla Użytkowników,
działań analitycznych i statystycznych,
windykacji należności,
ustalenia i dochodzenia roszczeń albo obrony przed nimi.
Podanie danych jest dobrowolne, ale niezbędne do zawarcia umowy albo skorzystania z innych funkcjonalności Serwisu.`,
    },
    {
      id: 'IV',
      title: 'IV. Rodzaj przetwarzanych danych osobowych',
      text: `Administrator może przetwarzać dane osobowe Użytkownika: imię i nazwisko, data urodzenia, adres zamieszkania, adres e-mail, numer telefonu, NIP.`,
    },
    {
      id: 'V',
      title: 'V. Okres przetwarzania danych osobowych',
      text: `Dane osobowe Użytkowników będą przetwarzane przez okres:

gdy podstawą przetwarzania danych jest wykonanie umowy – do momentu przedawnienia roszczeń po jej wykonaniu,
gdy podstawą przetwarzania danych jest zgoda – do momentu jej odwołania, a po odwołaniu zgody do przedawnienia roszczeń.

W obu przypadkach termin przedawnienia wynosi 6 lat, a dla roszczeń o świadczenia okresowe i roszczeń dotyczących prowadzenia działalności gospodarczej – 3 lata (jeśli przepis szczególny nie stanowi inaczej).`,
    },
    {
      id: 'VI',
      title: 'VI. Udostępnianie danych osobowych',
      text: `Dane osobowe Użytkowników mogą być przekazywane: podmiotom powiązanym z Administratorem, jego podwykonawcom, podmiotom współpracującym z Administratorem np. firmom obsługującym e-płatności, firmom świadczącym usługi kurierskie/pocztowe, kancelariom prawnym.
Dane osobowe Użytkowników nie będą/będą przekazywane poza teren Europejskiego Obszaru Gospodarczego (EOG).`,
    },
    {
      id: 'VII',
      title: 'VII. Prawa Użytkowników',
      text: `Użytkownik Serwisu ma prawo do: dostępu do treści swoich danych osobowych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia, wniesienia sprzeciwu wobec przetwarzania, cofnięcia zgody w każdej chwili (co nie ma wpływu na zgodność z prawem przetwarzania dokonanego w oparciu o zgodę przed jej cofnięciem).
Zgłoszenie o wystąpieniu przez Użytkownika z uprawnieniem wynikającym z wymienionych praw należy przesłać na adres kontakt@sportowy_vibe.com.pl.
Administrator spełnia lub odmawia spełnienia żądania niezwłocznie – maksymalnie w ciągu miesiąca od jego otrzymania.
Użytkownik ma prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych, jeśli uzna, że przetwarzanie narusza jego prawa i wolności (RODO).`,
    },
    {
      id: 'VIII',
      title: 'VIII. Pliki cookies',
      text: `Serwis zbiera informacje za pomocą plików cookies – sesyjnych, stałych i podmiotów zewnętrznych.
Zbieranie plików cookies wspiera poprawne świadczenie usług w Serwisie i służy celom statystycznym.
Użytkownik może określić zakres dostępu plików cookies do swojego urządzenia w ustawieniach przeglądarki.`,
    },
    {
      id: 'IX',
      title: 'IX. Zautomatyzowane podejmowanie decyzji i profilowanie',
      text: `Dane Użytkowników nie mogą być przetwarzane w zautomatyzowany sposób tak, że na skutek tego mogłyby zapaść wobec nich jakiekolwiek decyzje.
Dane Użytkowników mogą być profilowane celem dostosowania treści i personalizacji oferty po wyrażeniu przez nich zgody.`,
    },
    {
      id: 'X',
      title: 'X. Postanowienia końcowe',
      text: `Administrator ma prawo do wprowadzenia zmian w Polityce prywatności, przy czym prawa Użytkowników nie zostaną ograniczone.
Informacja o wprowadzonych zmianach pojawi się w formie komunikatu dostępnego w Serwisie.
W sprawach nieuregulowanych w niniejszej Polityce prywatności obowiązują przepisy RODO i przepisy prawa polskiego.`,
    },
  ],
};

export const privacyPolicyEN: PrivacyPolicyData = {
  title: 'Privacy Policy',
  sections: [
    {
      id: 'I',
      title: 'I. General Provisions',
      text: `This Privacy Policy defines how personal data of Users necessary to provide electronic services through the website sportowy_vibe.com.pl (hereinafter: Service) is collected, processed, and stored.
The Service collects only the personal data necessary to provide and develop the services offered therein.
Personal data collected through the Service is processed in accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation, hereinafter GDPR) and the Polish Personal Data Protection Act of 10 May 2018.`,
    },
    {
      id: 'II',
      title: 'II. Data Controller',
      text: `The Controller of personal data collected through the Service is Fundacja Równik Praw, with its registered office in Wrocław, ul. Legnicka 65, 54-206 Wrocław, Poland, KRS: 0000990331, NIP: 9462720408, REGON: 523032305, email address: kontakt@rownik-praw.org (hereinafter: Controller).`,
    },
    {
      id: 'III',
      title: 'III. Purpose of Collecting Personal Data',
      text: `Personal data is used for the purpose of:
account registration and identity verification of the User,
enabling login to the Service,
performance of the agreement concerning services and e-services,
communication with the User (livechat, contact form, etc.),
sending newsletters (subject to the User's consent),
operating the comment system,
providing community services,
promotion of the Controller's offer,
marketing, remarketing, affiliation,
personalization of the Service for Users,
analytical and statistical activities,
debt collection,
establishing and pursuing claims or defending against them.
Providing data is voluntary but necessary for concluding an agreement or using other functionalities of the Service.`,
    },
    {
      id: 'IV',
      title: 'IV. Types of Personal Data Processed',
      text: `The Controller may process the following User personal data: first name and surname, date of birth, residential address, email address, phone number, NIP (tax identification number).`,
    },
    {
      id: 'V',
      title: 'V. Period of Personal Data Processing',
      text: `Users' personal data will be processed for the period:

when the basis for data processing is the performance of an agreement — until the limitation of claims after its performance,
when the basis for data processing is consent — until its withdrawal, and after withdrawal of consent until the limitation of claims.

In both cases, the limitation period is 6 years, and for claims concerning periodic benefits and claims concerning business activity — 3 years (unless a specific regulation provides otherwise).`,
    },
    {
      id: 'VI',
      title: 'VI. Sharing of Personal Data',
      text: `Users' personal data may be transferred to: entities related to the Controller, its subcontractors, entities cooperating with the Controller, e.g. e-payment service providers, courier/postal service providers, law firms.
Users' personal data will not / will be transferred outside the European Economic Area (EEA).`,
    },
    {
      id: 'VII',
      title: 'VII. Users\' Rights',
      text: `The Service User has the right to: access their personal data, rectify it, delete it, restrict processing, data portability, object to processing, withdraw consent at any time (which does not affect the lawfulness of processing based on consent before its withdrawal).
A notification regarding the User exercising the rights listed above should be sent to kontakt@sportowy_vibe.com.pl.
The Controller fulfills or refuses to fulfill the request promptly — within a maximum of one month from receipt.
The User has the right to lodge a complaint with the President of the Personal Data Protection Office if they consider that the processing violates their rights and freedoms (GDPR).`,
    },
    {
      id: 'VIII',
      title: 'VIII. Cookies',
      text: `The Service collects information using cookies — session, persistent, and third-party cookies.
The collection of cookies supports the proper provision of services in the Service and serves statistical purposes.
The User may define the scope of cookie access to their device in the browser settings.`,
    },
    {
      id: 'IX',
      title: 'IX. Automated Decision-Making and Profiling',
      text: `Users' data may not be processed in an automated manner such that any decisions could be made against them as a result.
Users' data may be profiled for the purpose of tailoring content and personalizing offers after their consent has been given.`,
    },
    {
      id: 'X',
      title: 'X. Final Provisions',
      text: `The Controller has the right to amend this Privacy Policy, provided that Users' rights will not be limited.
Information about introduced changes will appear in the form of a notice available in the Service.
In matters not regulated by this Privacy Policy, the provisions of GDPR and Polish law shall apply.`,
    },
  ],
};