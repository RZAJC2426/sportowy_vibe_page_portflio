import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAllContent, updateContent, bustContentCache, type SiteContent } from '@/data/siteContent';

const COLOR_LABELS: Record<string, string> = {
  color_home_hero_badge: 'Hero — badge tekst',
  color_home_hero_headline_1: 'Hero — nagłówek główny (linia 1)',
  color_home_hero_headline_2: 'Hero — nagłówek główny (linia 2)',
  color_home_hero_desc: 'Hero — opis',
  color_home_hero_cta_news: 'Hero — przycisk Aktualności',
  color_home_hero_cta_community: 'Hero — przycisk Społeczność',
  color_home_about_badge: 'O nas — badge',
  color_home_about_title: 'O nas — tytuł',
  color_home_about_desc: 'O nas — opis',
  color_home_formats_badge: 'Formaty — badge',
  color_home_formats_title: 'Formaty — tytuł',
  color_home_formats_desc: 'Formaty — opis',
  color_home_youtube_badge: 'YouTube — badge',
  color_home_youtube_title: 'YouTube — tytuł',
  color_home_youtube_desc: 'YouTube — opis',
  color_home_stats_badge: 'Statystyki — badge',
  color_home_stats_title: 'Statystyki — tytuł',
  color_home_stats_desc: 'Statystyki — opis',
  color_home_goals_badge: 'Cele — badge',
  color_home_goals_title: 'Cele — tytuł',
  color_home_partners_badge: 'Partnerzy — badge',
  color_home_partners_title: 'Partnerzy — tytuł',
  color_home_partners_desc: 'Partnerzy — opis',
  color_home_certyfikacja_badge: 'Certyfikacja — badge',
  color_home_certyfikacja_title: 'Certyfikacja — tytuł',
  color_home_certyfikacja_desc: 'Certyfikacja — opis',
  color_home_contact_badge: 'Kontakt — badge',
  color_home_contact_title: 'Kontakt — tytuł',
  color_footer_rights: 'Footer — prawa autorskie',
  color_aktualnosci_hero_title: 'Aktualności — tytuł hero',
  color_aktualnosci_hero_desc: 'Aktualności — opis hero',
  color_cert_hero_badge: 'Certyfikacja — badge hero',
  color_cert_hero_title_line1: 'Certyfikacja — tytuł (linia 1)',
  color_cert_hero_title_line2: 'Certyfikacja — tytuł (linia 2)',
  color_cert_hero_desc: 'Certyfikacja — opis hero',
  color_fan_zone_badge: 'Strefa Kibica — badge',
  color_fan_zone_hero_desc: 'Strefa Kibica — opis hero',
  color_nasz_kanal_hero_title: 'Nasz Kanał — tytuł hero',
  color_nasz_kanal_hero_desc: 'Nasz Kanał — opis hero',
  color_historia_hero_badge: 'Historia — badge hero',
  color_historia_hero_title: 'Historia — tytuł hero',
  color_historia_hero_desc: 'Historia — opis hero',
  color_moderatorzy_hero_badge: 'Moderatorzy — badge hero',
  color_moderatorzy_hero_title: 'Moderatorzy — tytuł hero',
  color_moderatorzy_hero_desc: 'Moderatorzy — opis hero',
  color_tworcy_hero_badge: 'Twórcy — badge hero',
  color_tworcy_hero_title: 'Twórcy — tytuł hero',
  color_tworcy_hero_desc: 'Twórcy — opis hero',
  color_wspolpraca_hero_badge: 'Współpraca — badge hero',
  color_wspolpraca_hero_title: 'Współpraca — tytuł hero',
  color_wspolpraca_hero_desc: 'Współpraca — opis hero',
  color_dyscyplina_hero_title: 'Dyscyplina — tytuł hero',
  color_dyscyplina_hero_desc: 'Dyscyplina — opis hero',
  color_dyscyplina_badge: 'Dyscyplina — badge',
  color_harmonogram_hero_title: 'Harmonogram — tytuł hero',
  color_harmonogram_hero_desc: 'Harmonogram — opis hero',
  color_harmonogram_badge: 'Harmonogram — badge',
  color_harmonogram_table_title: 'Harmonogram — tytuł tabeli',
  color_harmonogram_cta_title: 'Harmonogram — tytuł CTA',
  color_harmonogram_cta_desc: 'Harmonogram — opis CTA',
  color_filmy_hero_title: 'Nasze Filmy — tytuł hero',
  color_filmy_hero_desc: 'Nasze Filmy — opis hero',
  color_filmy_cta_title: 'Nasze Filmy — tytuł CTA',
  color_filmy_cta_desc: 'Nasze Filmy — opis CTA',
  color_artykul_title: 'Artykuł — tytuł',
  color_artykul_summary: 'Artykuł — streszczenie',
  color_artykul_badge: 'Artykuł — badge dyscypliny',
  color_o_nas_hero_badge: 'O nas — badge hero',
  color_o_nas_hero_title: 'O nas — tytuł hero',
  color_o_nas_hero_desc: 'O nas — opis hero',
  color_ustawienia_hero_title: 'Ustawienia — tytuł hero',
  color_ustawienia_hero_desc: 'Ustawienia — opis hero',
  color_news_badge: 'Aktualności (home) — badge',
  color_news_title: 'Aktualności (home) — tytuł',
  color_news_desc: 'Aktualności (home) — opis',
  color_timeline_badge: 'Oś czasu — badge',
  color_timeline_title: 'Oś czasu — tytuł',
  color_basketball_badge: 'Koszykówka — badge',
  color_basketball_title: 'Koszykówka — tytuł',
  color_basketball_desc: 'Koszykówka — opis',
  color_wspolpraca_partners_title: 'Współpraca — tytuł partnerów',
  color_wspolpraca_partners_desc: 'Współpraca — opis partnerów',
  color_wspolpraca_cta_title: 'Współpraca — tytuł CTA',
  color_wspolpraca_cta_desc: 'Współpraca — opis CTA',
  color_wspolpraca_booking_title: 'Współpraca — tytuł rezerwacji',
  color_wspolpraca_booking_desc: 'Współpraca — opis rezerwacji',
  color_wspolpraca_form_title: 'Współpraca — tytuł formularza',
  color_wspolpraca_form_desc: 'Współpraca — opis formularza',
  color_aktualnosci_disciplines_badge: 'Aktualności — badge dyscypliny',
  color_aktualnosci_disciplines_title: 'Aktualności — tytuł dyscypliny',
};

const PRESET_COLORS = [
  '#14B8A6', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#F43F5E', '#F97316', '#F59E0B', '#84CC16',
  '#06B6D4', '#0EA5E9', '#64748B', '#94A3B8', '#1E293B',
  '#FFFFFF', '#F8FAFC', '#FEF3C7', '#FEF2F2', '#ECFDF5',
];

export default function ColorsManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllContent();
    // Only color keys + all potential color keys (show empty slots too)
    const colorItems = data.filter((i) => i.content_key.startsWith('color_'));
    setItems(colorItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStartEdit = (item: SiteContent) => {
    setEditingKey(item.content_key);
    setEditValue(item.content_text || '');
    setMessage(null);
  };

  const handleAddNew = (key: string) => {
    setEditingKey(key);
    setEditValue('');
    setMessage(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (key: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      // Remove override
      setSavingKey(key);
      const ok = await updateContent(key, '');
      setSavingKey(null);
      if (ok) {
        setEditingKey(null);
        setMessage({ type: 'success', text: 'Przywrócono domyślny kolor' });
        bustContentCache();
        setItems((prev) => prev.filter((i) => i.content_key !== key));
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: 'Błąd usuwania — sprawdź uprawnienia' });
      }
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
      setMessage({ type: 'error', text: 'Nieprawidłowy kod HEX (wymagany format: #RRGGBB)' });
      return;
    }
    setSavingKey(key);
    const ok = await updateContent(key, trimmed);
    setSavingKey(null);
    if (ok) {
      setEditingKey(null);
      setMessage({ type: 'success', text: 'Kolor zapisany!' });
      bustContentCache();
      setItems((prev) => {
        const existing = prev.find((i) => i.content_key === key);
        if (existing) {
          return prev.map((i) =>
            i.content_key === key ? { ...i, content_text: trimmed } : i
          );
        }
        return [...prev, { id: Date.now(), content_key: key, content_text: trimmed, updated_at: new Date().toISOString() }];
      });
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage({ type: 'error', text: 'Błąd zapisu — sprawdź uprawnienia' });
    }
  };

  const allColorKeys = Object.keys(COLOR_LABELS);
  const activeKeys = new Set(items.map((i) => i.content_key));

  const filteredKeys = allColorKeys.filter((k) => {
    const label = COLOR_LABELS[k];
    return (
      !filter ||
      label.toLowerCase().includes(filter.toLowerCase()) ||
      k.toLowerCase().includes(filter.toLowerCase())
    );
  });

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
            Kolory tekstów
          </h3>
          <p className="text-xs text-foreground-500 mt-0.5">
            Zarządzaj kolorami poszczególnych elementów tekstowych na stronie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-400"></i>
            <input
              type="text"
              placeholder="Szukaj koloru..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-52 rounded-md border border-background-200 bg-background-50 pl-8 pr-3 py-1.5 text-xs text-foreground-800 outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-300"
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

      <div className="space-y-2">
        {filteredKeys.map((key) => {
          const item = items.find((i) => i.content_key === key);
          const isEditing = editingKey === key;
          const isActive = activeKeys.has(key);
          const label = COLOR_LABELS[key];

          return (
            <div
              key={key}
              className={`rounded-lg border transition-colors ${
                isEditing
                  ? 'border-accent-400 bg-accent-50/30'
                  : 'border-background-200/70 bg-background-50 hover:border-background-300'
              }`}
            >
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Color swatch */}
                  <div
                    className="h-8 w-8 shrink-0 rounded-md border border-background-200 shadow-sm"
                    style={{ backgroundColor: item?.content_text || '#94a3b8' }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-accent-600 bg-accent-50 px-1.5 py-0.5 rounded">
                        {key}
                      </code>
                      {isActive && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          aktywny
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground-700 mt-0.5">{label}</p>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editValue || '#14B8A6'}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-background-200 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="#RRGGBB"
                        className="w-24 rounded-md border border-background-200 bg-background-50 px-2 py-1 text-xs text-foreground-900 outline-none focus:border-accent-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSave(key)}
                        disabled={savingKey === key}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-accent-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-600 transition-colors disabled:opacity-60 whitespace-nowrap"
                      >
                        {savingKey === key ? (
                          <i className="ri-loader-4-line animate-spin text-xs"></i>
                        ) : (
                          <i className="ri-check-line text-xs"></i>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-background-100 px-2.5 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-200 transition-colors whitespace-nowrap"
                      >
                        <i className="ri-close-line text-xs"></i>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => isActive ? handleStartEdit(item!) : handleAddNew(key)}
                      className="flex-shrink-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:text-accent-500 hover:bg-accent-50 transition-colors"
                      title={isActive ? 'Edytuj kolor' : 'Dodaj kolor'}
                    >
                      <i className={`${isActive ? 'ri-pencil-line' : 'ri-add-line'} text-sm`}></i>
                    </button>
                  )}
                </div>

                {/* Presets when editing */}
                {isEditing && (
                  <div className="mt-3 grid grid-cols-10 gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditValue(c)}
                        className={`h-5 w-full rounded border transition-all cursor-pointer hover:scale-110 ${
                          editValue.toUpperCase() === c.toUpperCase()
                            ? 'border-primary-500 scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredKeys.length === 0 && (
        <div className="text-center py-16">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-foreground-400 mb-3">
            <i className="ri-palette-line text-xl"></i>
          </span>
          <p className="text-sm text-foreground-500">
            {filter ? 'Brak wyników dla podanego filtra.' : 'Brak dostępnych kolorów.'}
          </p>
        </div>
      )}
    </div>
  );
}