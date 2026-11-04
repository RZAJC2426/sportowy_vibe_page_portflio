import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAllDisciplines, bustDisciplinesCache, type Discipline } from '@/data/disciplines';

const POSITION_OPTIONS = [
  { value: 'center', label: 'Środek (domyślnie)' },
  { value: 'top', label: 'Góra' },
  { value: 'bottom', label: 'Dół' },
  { value: 'left', label: 'Lewo' },
  { value: 'right', label: 'Prawo' },
  { value: 'top left', label: 'Góra-lewo' },
  { value: 'top right', label: 'Góra-prawo' },
  { value: 'bottom left', label: 'Dół-lewo' },
  { value: 'bottom right', label: 'Dół-prawo' },
  { value: '25% 75%', label: 'Niestandardowe 25% 75%' },
  { value: '75% 25%', label: 'Niestandardowe 75% 25%' },
  { value: '50% 30%', label: 'Niestandardowe 50% 30%' },
];

export default function DisciplinesManager() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    loadDisciplines();
  }, []);

  async function loadDisciplines() {
    setLoading(true);
    try {
      const data = await fetchAllDisciplines();
      setDisciplines(data);
    } catch (e) {
      console.error('Failed to load disciplines:', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveDiscipline(slug: string, heroImage: string, heroPosition: string) {
    setSaving(slug);
    try {
      const { error } = await supabase
        .from('disciplines')
        .update({ hero_image: heroImage || null, hero_position: heroPosition || 'center' })
        .eq('slug', slug);

      if (error) {
        console.error('Save error:', error);
        alert('Błąd zapisu: ' + error.message);
        return;
      }

      bustDisciplinesCache();
      setDisciplines((prev) =>
        prev.map((d) =>
          d.slug === slug ? { ...d, heroImage: heroImage || null, heroPosition: heroPosition || 'center' } : d,
        ),
      );
      setEditing(null);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
          <i className="ri-loader-4-line text-xl"></i>
        </span>
        <p className="mt-3 text-sm text-foreground-500">Ładowanie dyscyplin...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground-950">Ustawienia tła Hero — Dyscypliny</h2>
        <p className="mt-1 text-sm text-foreground-500">
          Zmień obrazek tła i jego kadrowanie dla każdej podstrony dyscypliny. Zmiany są widoczne natychmiast po zapisie.
        </p>
      </div>

      <div className="space-y-4">
        {disciplines.filter((d) => d.hasSubpage).map((d) => (
          <div
            key={d.slug}
            className="rounded-xl border border-background-200/70 bg-background-50 p-5 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Preview */}
              <div className="shrink-0">
                <div className="relative h-24 w-40 rounded-lg overflow-hidden bg-background-200 border border-background-300/60">
                  {d.heroImage ? (
                    <img
                      src={d.heroImage}
                      alt={d.name}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: d.heroPosition || 'center' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-foreground-400">
                      <span className="flex flex-col items-center gap-1">
                        <i className="ri-image-line text-lg"></i>
                        Brak zdjęcia
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground-700 flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                  ></span>
                  {d.name}
                </p>
              </div>

              {/* Edit form */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground-500 mb-1">
                    URL obrazka tła Hero
                  </label>
                  <input
                    type="text"
                    defaultValue={d.heroImage || ''}
                    placeholder="https://example.com/hero-image.jpg"
                    className="w-full rounded-lg border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                    id={`hero-url-${d.slug}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground-500 mb-1">
                    Kadrowanie (object-position)
                  </label>
                  <select
                    defaultValue={d.heroPosition || 'center'}
                    className="w-full rounded-lg border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30 appearance-none cursor-pointer"
                    id={`hero-pos-${d.slug}`}
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const urlInput = document.getElementById(`hero-url-${d.slug}`) as HTMLInputElement;
                    const posSelect = document.getElementById(`hero-pos-${d.slug}`) as HTMLSelectElement;
                    saveDiscipline(d.slug, urlInput?.value || '', posSelect?.value || 'center');
                  }}
                  disabled={saving === d.slug}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  <i className={`${saving === d.slug ? 'ri-loader-4-line animate-spin' : 'ri-check-line'} text-sm`}></i>
                  {saving === d.slug ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                {d.heroImage && (
                  <button
                    type="button"
                    onClick={() => {
                      const urlInput = document.getElementById(`hero-url-${d.slug}`) as HTMLInputElement;
                      if (urlInput) urlInput.value = '';
                      saveDiscipline(d.slug, '', 'center');
                    }}
                    disabled={saving === d.slug}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:border-red-300 whitespace-nowrap cursor-pointer disabled:opacity-60 active:scale-95"
                  >
                    <i className="ri-delete-bin-line text-sm"></i>
                    Wyczyść
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {disciplines.filter((d) => d.hasSubpage).length === 0 && (
          <div className="text-center py-10">
            <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-200/70 text-foreground-400 mb-3">
              <i className="ri-football-line text-xl"></i>
            </span>
            <p className="text-sm text-foreground-500">Brak dyscyplin z podstronami w bazie.</p>
          </div>
        )}
      </div>
    </div>
  );
}