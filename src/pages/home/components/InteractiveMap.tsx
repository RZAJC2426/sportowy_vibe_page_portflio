import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';

export interface CountryData {
  rank: string;
  name: string;
  views: string;
  pct: number;
  left: string;
  top: string;
  highlight: boolean;
  description: string;
}

export const COUNTRIES: CountryData[] = [
  {
    rank: '#1',
    name: 'Niemcy',
    views: '71 516+',
    pct: 100,
    left: '51.0%',
    top: '32.6%',
    highlight: true,
    description:
      'Największa baza widzów z Europy Środkowej. Niemcy dominują w statystykach oglądalności kanału Sportowy Vibe, generując ponad 71 tysięcy wyświetleń od momentu powstania kanału.',
  },
  {
    rank: '#2',
    name: 'Wielka Brytania',
    views: '30 527+',
    pct: 43,
    left: '46.4%',
    top: '30.3%',
    highlight: false,
    description:
      'Brytyjscy fani sportu konsekwentnie zajmują drugie miejsce. Silna pozycja w rankingu potwierdza globalny zasięg kanału w krajach anglojęzycznych.',
  },
  {
    rank: '#3',
    name: 'Stany Zjednoczone',
    views: '26 564+',
    pct: 37,
    left: '19.5%',
    top: '38.5%',
    highlight: false,
    description:
      'Amerykańska społeczność kibiców aktywnie śledzi nasze transmisje i analizy sportowe. USA to kluczowy rynek dla rozwoju międzynarodowego zasięgu.',
  },
  {
    rank: '#4',
    name: 'Tajlandia',
    views: '18 325+',
    pct: 26,
    left: '75.4%',
    top: '56.5%',
    highlight: false,
    description:
      'Tajlandia to niespodzianka w TOP 10 — dynamicznie rosnąca grupa widzów z Azji Południowo-Wschodniej, zainteresowana siatkówką i koszykówką.',
  },
  {
    rank: '#5',
    name: 'Filipiny',
    views: '16 571+',
    pct: 23,
    left: '81.1%',
    top: '58.8%',
    highlight: false,
    description:
      'Filipiny to kolejny azjatycki rynek z rosnącą liczbą wyświetleń. Fanatycy sportu z regionu doceniają nasze transmisje na żywo.',
  },
  {
    rank: '#6',
    name: 'Holandia',
    views: '9 941+',
    pct: 14,
    left: '49.2%',
    top: '33.1%',
    highlight: false,
    description:
      'Holenderscy widzowie regularnie wracają do kanału. Wysoki wskaźnik oglądalności procentowej wskazuje na zaangażowaną lokalną społeczność.',
  },
  {
    rank: '#7',
    name: 'Kanada',
    views: '8 092+',
    pct: 11,
    left: '15.4%',
    top: '23.2%',
    highlight: false,
    description:
      'Kanadyjscy fani reprezentują stabilną bazę widzów z Ameryki Północnej. Wysoka retencja i powracający użytkownicy to nasza siła.',
  },
  {
    rank: '#8',
    name: 'Francja',
    views: '7 317+',
    pct: 10,
    left: '48.4%',
    top: '36.5%',
    highlight: false,
    description:
      'Francuzi to aktywna grupa widzów z Europy Zachodniej. Szczególnie popularne są transmisje z piłki nożnej i sportów zimowych.',
  },
  {
    rank: '#9',
    name: 'Norwegia',
    views: '4 700+',
    pct: 7,
    left: '50.2%',
    top: '24.2%',
    highlight: false,
    description:
      'Norwescy fani skoków narciarskich i sportów zimowych to lojalna grupa widzów. Wysoka jakość oglądalności mimo mniejszej populacji.',
  },
  {
    rank: '#10',
    name: 'Włochy',
    views: '4 388+',
    pct: 6,
    left: '50.5%',
    top: '37.5%',
    highlight: false,
    description:
      'Włosi zamykają TOP 10 z solidnym wynikiem. Piłka nożna, siatkówka i sport motorowy to najczęściej oglądane dyscypliny w tym regionie.',
  },
];

const FLAG_URL = 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/5a672eb5-4dcb-478c-ac3f-c3efe93d6aec_flagge.svg';
const MAP_URL = 'https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/3aede087-b2bb-4be6-b8d2-9b9d3d38caa3_Simplified_World_Map.svg';

interface MapPinProps {
  country: CountryData;
  onSelect: (c: CountryData, e: React.MouseEvent) => void;
  mapScale: number;
}

function MapPin({ country, onSelect, mapScale }: MapPinProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(country, e);
  }, [country, onSelect]);

  const compensation = Math.max(0.55, Math.min(1.35, 1 / Math.pow(mapScale, 0.35)));

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute z-10 cursor-pointer group touch-none"
      style={{ left: country.left, top: country.top }}
      aria-label={`${country.name} — ${country.views}`}
    >
      {/* Tooltip — desktop only */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 hidden md:block">
        <div className="bg-foreground-900 text-white text-xs rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg">
          <div className="font-bold">{country.name}</div>
          <div className="text-foreground-300 text-[11px]">
            {country.rank} · {country.views}
          </div>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground-900 rotate-45 -mt-1"></div>
      </div>

      {/* Flag pin visual */}
      <div
        style={{ transform: `translate(-50%, -100%) scale(${compensation})` }}
      >
        <div
          className="relative transition-all duration-200 ease-out will-change-transform group-hover:scale-[1.2] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          style={{ width: 'clamp(24px, 3vw, 40px)', height: 'clamp(30px, 3.6vw, 48px)' }}
        >
          <img
            src={FLAG_URL}
            alt={country.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
          {/* Rank badge */}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-primary-500 text-white text-[9px] md:text-[10px] font-bold shadow-md border border-white/20">
            {country.rank.replace('#', '')}
          </span>
        </div>
      </div>

      {/* Mobile label */}
      <span className="md:hidden mt-0.5 text-[9px] font-semibold text-white/90 bg-foreground-900/70 px-1 rounded whitespace-nowrap">
        {country.name}
      </span>
    </button>
  );
}

interface CountryModalProps {
  country: CountryData | null;
  onClose: () => void;
}

function CountryModal({ country, onClose }: CountryModalProps) {
  if (!country) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-background-50 border border-background-200/70 shadow-2xl p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-background-100 hover:bg-background-200 transition-colors cursor-pointer"
          aria-label="Zamknij"
        >
          <i className="ri-close-line text-foreground-700"></i>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <span
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 ${
              country.highlight
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-900'
            }`}
          >
            {country.rank}
          </span>
          <div>
            <h3
              id="country-modal-title"
              className="font-heading text-xl font-bold text-foreground-950"
            >
              {country.name}
            </h3>
            <p className="text-sm text-foreground-500">
              {country.views} wyświetleń
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground-600">
              Udział w globalnych wyświetleniach
            </span>
            <span className="font-heading text-sm font-bold text-primary-500">
              {country.pct}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-background-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-1000 ease-out"
              style={{ width: `${country.pct}%` }}
            ></div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-foreground-700">
          {country.description}
        </p>

        {/* Footer stats */}
        <div className="mt-5 pt-4 border-t border-background-200/60 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-background-100 p-3 text-center">
            <div className="font-heading text-lg font-bold text-primary-500">
              {country.views}
            </div>
            <div className="text-[11px] text-foreground-500 uppercase tracking-wide mt-0.5">
              Wyświetleń
            </div>
          </div>
          <div className="rounded-lg bg-background-100 p-3 text-center">
            <div className="font-heading text-lg font-bold text-accent-500">
              {country.rank}
            </div>
            <div className="text-[11px] text-foreground-500 uppercase tracking-wide mt-0.5">
              Pozycja
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveMap() {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pinchActive, setPinchActive] = useState(false);
  const [hidePins, setHidePins] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const pinchStartRef = useRef({ dist: 0, scale: 1 });
  const movedRef = useRef(false);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s * 1.4, 14));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s / 1.4, 0.4));
  }, []);

  const togglePins = useCallback(() => {
    setHidePins((h) => !h);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  // Dev mode click — logs percentage coords relative to container
  // Accounts for CSS transform-origin: center (default)
  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    // Inverse of: screen = center + (local - center) * scale + translate
    const mapX = (clickX - w / 2 - translateX) / scale + w / 2;
    const mapY = (clickY - h / 2 - translateY) / scale + h / 2;
    const pctX = (mapX / w) * 100;
    const pctY = (mapY / h) * 100;
    // eslint-disable-next-line no-console
    console.log(`left: ${pctX.toFixed(1)}%, top: ${pctY.toFixed(1)}%`);
  }, [translateX, translateY, scale]);

  // Pin select with drag guard
  const handlePinSelect = useCallback((c: CountryData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setSelectedCountry(c);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCountry(null);
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    movedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      tx: translateX,
      ty: translateY,
    };
  }, [translateX, translateY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      movedRef.current = true;
    }
    setTranslateX(dragStartRef.current.tx + dx);
    setTranslateY(dragStartRef.current.ty + dy);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch drag + pinch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartRef.current = {
        dist: Math.sqrt(dx * dx + dy * dy),
        scale,
      };
      setPinchActive(true);
    } else if (e.touches.length === 1) {
      movedRef.current = false;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: translateX,
        ty: translateY,
      };
    }
  }, [scale, translateX, translateY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pinchActive && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchStartRef.current.dist;
      const newScale = Math.min(
        Math.max(pinchStartRef.current.scale * ratio, 0.4),
        14,
      );
      setScale(newScale);
    } else if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        movedRef.current = true;
      }
      setTranslateX(dragStartRef.current.tx + dx);
      setTranslateY(dragStartRef.current.ty + dy);
    }
  }, [pinchActive, isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setPinchActive(false);
  }, []);

  // Wheel zoom via native listener (passive: false)
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.88 : 1.14;
      setScale((s) => Math.min(Math.max(s * delta, 0.4), 14));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  return (
    <>
      <div className="rounded-2xl border border-background-200/70 overflow-hidden mb-10">
        <div className="bg-background-100 px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-heading text-lg font-bold text-foreground-900">
            <EditableColor contentKey="color_stats_map_title" fallbackColor="#0F172A">
              <EditableText contentKey="stats_map_title" fallback={t('stats.map_title')} />
            </EditableColor>
          </h3>
          <span className="text-xs text-foreground-400 italic">
            {t('stats.map_subtitle')}
          </span>
        </div>

        {/* Map container — locked aspect ratio, overflow visible for tooltips */}
        <div
          ref={mapRef}
          className="relative w-full overflow-visible bg-[#0b1a30] select-none touch-none"
          style={{ aspectRatio: '2091 / 1059', display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleMapClick}
        >
          {/* Transform wrapper — zoom + pan */}
          <div
            className="absolute inset-0 origin-center will-change-transform"
            style={{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              transition: isDragging || pinchActive ? 'none' : 'transform 0.25s ease-out',
            }}
          >
            {/* World Map SVG — fills container exactly, no object-contain */}
            <img
              src={MAP_URL}
              alt="Mapa świata — zasięg Sportowy Vibe"
              title="Globalna mapa wyświetleń kanału Sportowy Vibe"
              loading="lazy"
              decoding="async"
              className="absolute top-0 left-0 w-full h-full block select-none"
              draggable={false}
            />

            {/* Flag pins — inside transform wrapper so they scale with map */}
            {!hidePins &&
              COUNTRIES.map((c) => (
                <MapPin
                  key={c.name}
                  country={c}
                  onSelect={handlePinSelect}
                  mapScale={scale}
                />
              ))}
          </div>

          {/* Zoom level indicator */}
          <div className="absolute bottom-3 left-3 z-20 text-[10px] text-white/60 bg-background-900/40 backdrop-blur-sm rounded-md px-2 py-1 font-mono">
            {Math.round(scale * 100)}%
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 bg-background-900/40 backdrop-blur-sm rounded-xl p-1.5 border border-white/10">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); zoomIn(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-background-50/90 hover:bg-primary-500 hover:text-white text-foreground-700 transition-all cursor-pointer shadow-sm"
              aria-label="Przybliż"
            >
              <i className="ri-zoom-in-line text-sm"></i>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); zoomOut(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-background-50/90 hover:bg-primary-500 hover:text-white text-foreground-700 transition-all cursor-pointer shadow-sm"
              aria-label="Oddal"
            >
              <i className="ri-zoom-out-line text-sm"></i>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); resetView(); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-background-50/90 hover:bg-primary-500 hover:text-white text-foreground-700 transition-all cursor-pointer shadow-sm"
              aria-label="Resetuj widok"
            >
              <i className="ri-restart-line text-sm"></i>
            </button>
            <div className="w-full h-px bg-white/15 my-0.5"></div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePins(); }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer shadow-sm ${
                hidePins
                  ? 'bg-accent-500 text-white'
                  : 'bg-background-50/90 hover:bg-primary-500 hover:text-white text-foreground-700'
              }`}
              aria-label={hidePins ? 'Pokaż pinezki' : 'Ukryj pinezki (dev mode)'}
              title={hidePins ? 'Pokaż pinezki' : 'Ukryj pinezki — klikaj w kolorowe obszary by pobrać współrzędne'}
            >
              <i className={`text-sm ${hidePins ? 'ri-eye-off-line' : 'ri-eye-line'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CountryModal country={selectedCountry} onClose={handleCloseModal} />
    </>
  );
}