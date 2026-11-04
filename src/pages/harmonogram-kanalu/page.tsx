import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAllChannelSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  type ChannelScheduleItem,
} from '@/data/channelSchedule';
import TopBar from '@/pages/home/components/TopBar';
import Navbar from '@/pages/home/components/Navbar';
import Breadcrumbs from '@/components/feature/Breadcrumbs';
import EditableImage from '@/components/feature/EditableImage';
import EditableText from '@/components/feature/EditableText';
import EditableColor from '@/components/feature/EditableColor';

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(isoTime: string): string {
  const [h, m] = isoTime.split(':');
  return `${h}:${m}`;
}

export default function HarmonogramKanaluPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [events, setEvents] = useState<ChannelScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchAllChannelSchedule();
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [saving, setSaving] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addTime, setAddTime] = useState('');

  const startEdit = (item: ChannelScheduleItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDate(item.event_date);
    setEditTime(item.event_time);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDate('');
    setEditTime('');
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editDate || !editTime) return;
    setSaving(true);
    const ok = await updateScheduleItem(editingId!, {
      title: editTitle.trim(),
      event_date: editDate,
      event_time: editTime,
    });
    if (ok) {
      setEditingId(null);
      await loadEvents();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Na pewno usunąć to wydarzenie?')) return;
    const ok = await deleteScheduleItem(id);
    if (ok) await loadEvents();
  };

  const handleAdd = async () => {
    if (!addTitle.trim() || !addDate || !addTime) return;
    setSaving(true);
    const created = await createScheduleItem({
      title: addTitle.trim(),
      event_date: addDate,
      event_time: addTime,
    });
    if (created) {
      setShowAddForm(false);
      setAddTitle('');
      setAddDate('');
      setAddTime('');
      await loadEvents();
    }
    setSaving(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Harmonogram Kanału — Plan Transmisji | Sportowy Vibe',
            description: 'Sprawdź harmonogram transmisji i wydarzeń kanału Sportowy Vibe. Zaplanowane transmisje na żywo, studio meczowe i programy sportowe — bądź na bieżąco.',
          }),
        }}
      />
      <TopBar />
      <Navbar showBackButton />

      <Breadcrumbs sticky />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[380px] md:min-h-[480px] items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <EditableImage
              contentKey="harmonogram_hero_bg"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/6e6b2fe0-150e-416f-b4db-9fc01f3d082c_compressed_Gemini_Generated_Image_vne990vne990vne9.webp"
              alt="Harmonogram Sportowy Vibe — kalendarz wydarzeń sportowych"
              containerClassName="h-full w-full"
              className="h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
          </div>
          <div className="relative z-10 mx-auto max-w-[900px] px-4 md:px-6 text-center">
            <div className="inline-block mb-6 overflow-hidden rounded-lg px-4 py-2">
              <EditableImage
                contentKey="harmonogram_hero_logo"
                fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/5f809f16-726f-4e78-9150-591a36aa9ee5_sportowy_vibeslogan_white.svg"
                alt="Sportowy VIBE — Energia Sportu Każdego Dnia"
                className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 ease-out hover:scale-110"
              />
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-white tracking-tight">
              <EditableColor contentKey="color_harmonogram_hero_title" fallbackColor="#FFFFFF">
                <EditableText contentKey="harmonogram_hero_title" fallback={t('harmonogram.title')} shadowKey="shadow_harmonogram_hero_h1" shadowFallback="0 2px 13px rgba(0,0,0,0.65)" />
              </EditableColor>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base text-white/90">
              <EditableColor contentKey="color_harmonogram_hero_desc" fallbackColor="rgba(255,255,255,0.9)">
                <EditableText contentKey="harmonogram_hero_desc" fallback={t('harmonogram.desc')} as="span" shadowKey="shadow_harmonogram_hero_p" shadowFallback="0 2px 10px rgba(0,0,0,0.52)" />
              </EditableColor>
            </p>
          </div>
        </section>

        {/* Schedule Table */}
        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-[1100px] px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                  <i className="ri-calendar-schedule-line"></i>
                  {t('harmonogram.badge')}
                </span>
                <h2 className="mt-4 font-heading text-2xl md:text-3xl font-bold text-primary-600">
                  <EditableColor contentKey="color_harmonogram_table_title" fallbackColor="#2563eb">
                    <EditableText contentKey="harmonogram_table_title" fallback={t('harmonogram.table_title')} />
                  </EditableColor>
                </h2>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line"></i>
                  {t('harmonogram.add_event')}
                </button>
              )}
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="mb-6 rounded-lg border border-primary-300/50 bg-primary-50/50 p-5">
                <h3 className="font-heading text-lg font-semibold text-primary-600 mb-4">
                  <EditableColor contentKey="color_harmonogram_new_event" fallbackColor="#2563eb">
                    <EditableText contentKey="harmonogram_new_event" fallback={t('harmonogram.new_event')} />
                  </EditableColor>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder={t('harmonogram.field_title')}
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    className="rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                  />
                  <input
                    type="date"
                    min={today}
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                  />
                  <input
                    type="time"
                    value={addTime}
                    onChange={(e) => setAddTime(e.target.value)}
                    className="rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={saving}
                      className="inline-flex items-center gap-1 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      {saving ? (
                        <><i className="ri-loader-4-line animate-spin"></i> {t('harmonogram.saving')}</>
                      ) : (
                        <><i className="ri-check-line"></i> {t('harmonogram.save')}</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setAddTitle(''); setAddDate(''); setAddTime(''); }}
                      className="inline-flex items-center gap-1 rounded-md border border-background-200/70 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 whitespace-nowrap cursor-pointer"
                    >
                      {t('harmonogram.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-14">
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
                  <i className="ri-loader-4-line text-2xl"></i>
                </span>
                <p className="mt-3 text-sm text-foreground-500">{t('harmonogram.loading')}</p>
              </div>
            ) : events.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-background-200/70">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-background-200/70 bg-background-100">
                      <th className="px-4 py-3 text-left font-semibold text-foreground-700 w-16">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground-700">{t('harmonogram.col_title')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground-700 w-36">{t('harmonogram.col_date')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground-700 w-28">{t('harmonogram.col_time')}</th>
                      {isAdmin && (
                        <th className="px-4 py-3 text-center font-semibold text-foreground-700 w-24">{t('harmonogram.col_actions')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="border-b border-background-200/70 bg-background-50 transition-colors hover:bg-background-100/50"
                      >
                        {editingId === item.id ? (
                          <>
                            <td className="px-4 py-3 text-foreground-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full rounded-md border border-primary-300/50 bg-background-50 px-2 py-1.5 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                min={today}
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full rounded-md border border-primary-300/50 bg-background-50 px-2 py-1.5 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="w-full rounded-md border border-primary-300/50 bg-background-50 px-2 py-1.5 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                              />
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={saveEdit}
                                    disabled={saving}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-primary-500 text-white transition-all hover:bg-primary-600 disabled:opacity-50"
                                    title={t('harmonogram.save')}
                                  >
                                    <i className={`${saving ? 'ri-loader-4-line animate-spin' : 'ri-check-line'} text-sm`}></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-background-200/70 bg-background-50 text-foreground-500 transition-colors hover:bg-background-100"
                                    title={t('harmonogram.cancel')}
                                  >
                                    <i className="ri-close-line text-sm"></i>
                                  </button>
                                </div>
                              </td>
                            )}
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-foreground-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-foreground-900">{item.title}</td>
                            <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">{formatDate(item.event_date)}</td>
                            <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">{formatTime(item.event_time)}</td>
                            {isAdmin && (
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-background-200/70 bg-background-50 text-foreground-500 transition-colors hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300/50"
                                    title={t('harmonogram.edit')}
                                  >
                                    <i className="ri-edit-line text-sm"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-background-200/70 bg-background-50 text-foreground-500 transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-300/50"
                                    title={t('harmonogram.delete')}
                                  >
                                    <i className="ri-delete-bin-line text-sm"></i>
                                  </button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-14">
                <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-background-200/70 text-foreground-400 mb-4">
                  <i className="ri-calendar-schedule-line text-2xl"></i>
                </span>
                <p className="text-sm text-foreground-500">{t('harmonogram.empty')}</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-20 bg-background-100">
          <div className="mx-auto max-w-[800px] px-4 md:px-6 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-600">
              <EditableColor contentKey="color_harmonogram_cta_title" fallbackColor="#2563eb">
                <EditableText contentKey="harmonogram_cta_title" fallback={t('harmonogram.cta_title')} />
              </EditableColor>
            </h2>
            <p className="mt-3 text-sm text-foreground-500">
              <EditableColor contentKey="color_harmonogram_cta_desc" fallbackColor="#475569">
                {t('harmonogram.cta_desc')}
              </EditableColor>
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://www.youtube.com/@Sportowy_Vibe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-youtube-fill"></i>
                YouTube
              </a>
              <Link to="/nasze-filmy"
                className="inline-flex items-center gap-2 rounded-md border border-primary-500/50 px-6 py-3 text-sm font-semibold text-primary-600 transition-all hover:border-primary-500 hover:bg-primary-50/50 whitespace-nowrap cursor-pointer active:scale-95 active:bg-primary-100/50"
              >
                <i className="ri-film-line"></i>
                {t('footer.movies')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-background-200/70 bg-background-100 py-8">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 flex flex-col items-center gap-5">
          <Link to="/" className="flex items-center cursor-pointer active:opacity-70">
            <EditableImage
              contentKey="site_logo_footer"
              fallbackSrc="https://storage.readdy-site.link/project_files/6b577641-b4ea-4107-bb56-5f8fbbf97e07/319ec2ab-1af0-46ca-beed-0358e5e16485_sportowy_vibebez-sloganu2.svg"
              alt="Sportowy VIBE"
              className="h-8 w-auto max-w-[130px] object-contain"
            />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-foreground-400">
            <Link to="/" className="hover:text-foreground-700 transition-colors cursor-pointer">{t('nav.home')}</Link>
            <span className="text-foreground-300">|</span>
            <Link to="/nasze-filmy" className="hover:text-foreground-700 transition-colors cursor-pointer">{t('footer.movies')}</Link>
            <span className="text-foreground-300">|</span>
            <Link to="/o-nas/tworcy" className="hover:text-foreground-700 transition-colors cursor-pointer">{t('nav.about')}</Link>
            <span className="text-foreground-300">|</span>
            <button type="button" onClick={() => { navigate('/'); setTimeout(() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' }), 300); }} className="hover:text-foreground-700 transition-colors cursor-pointer bg-transparent border-none p-0 text-xs">{t('nav.contact')}</button>
            <span className="text-foreground-300">|</span>
            <Link to="/o-nas/wspolpraca" className="hover:text-foreground-700 transition-colors cursor-pointer">{t('nav.cooperation')}</Link>
            <span className="text-foreground-300">|</span>
            <Link to="/polityka-prywatnosci" className="hover:text-foreground-700 transition-colors cursor-pointer">{t('footer.privacy')}</Link>
            <span className="text-foreground-300">|</span>
            <Link to="/regulamin-serwisu" className="hover:text-foreground-700 transition-colors cursor-pointer">Regulamin Serwisu</Link>
          </div>
          <div className="flex items-center justify-between w-full flex-col sm:flex-row gap-4">
            <p className="text-xs text-foreground-400">{t('footer.rights')}</p>
            <div className="flex items-center gap-3">
              <a href="https://www.youtube.com/@sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors"><span className="flex h-8 w-8 items-center justify-center"><i className="ri-youtube-fill text-lg"></i></span></a>
              <a href="https://www.facebook.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors"><span className="flex h-8 w-8 items-center justify-center"><i className="ri-facebook-fill text-lg"></i></span></a>
              <a href="https://www.instagram.com/sportowy_vibe" target="_blank" rel="noopener noreferrer" className="text-foreground-400 hover:text-primary-500 transition-colors"><span className="flex h-8 w-8 items-center justify-center"><i className="ri-instagram-line text-lg"></i></span></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}