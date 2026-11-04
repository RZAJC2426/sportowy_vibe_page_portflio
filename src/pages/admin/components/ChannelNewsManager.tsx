import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { bustDisciplinesCache, type ChannelNewsItem } from '@/data/disciplines';

interface ChannelNewsFormData {
  icon: string;
  tag: string;
  title: string;
  description: string;
  newsDate: string;
  sortOrder: number;
}

const EMPTY_CHANNEL_NEWS: ChannelNewsFormData = {
  icon: 'ri-megaphone-line',
  tag: '',
  title: '',
  description: '',
  newsDate: new Date().toISOString().split('T')[0],
  sortOrder: 10,
};

const ICON_OPTIONS = [
  'ri-megaphone-line',
  'ri-live-line',
  'ri-trophy-line',
  'ri-team-line',
  'ri-hand-heart-line',
  'ri-calendar-event-line',
  'ri-rocket-line',
  'ri-star-line',
  'ri-notification-3-line',
  'ri-flashlight-line',
];

export default function ChannelNewsManager() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChannelNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ChannelNewsFormData>(EMPTY_CHANNEL_NEWS);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('channel_news')
      .select('*')
      .order('sort_order', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setItems((data as ChannelNewsItem[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleEdit = (item: ChannelNewsItem) => {
    setEditingId(item.id);
    setIsNew(false);
    setFormData({
      icon: item.icon,
      tag: item.tag,
      title: item.title,
      description: item.description || '',
      newsDate: item.newsDate || new Date().toISOString().split('T')[0],
      sortOrder: item.sortOrder,
    });
    setFeedback(null);
  };

  const handleNew = () => {
    setEditingId(-1);
    setIsNew(true);
    setFormData({
      ...EMPTY_CHANNEL_NEWS,
      newsDate: new Date().toISOString().split('T')[0],
    });
    setFeedback(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsNew(false);
    setFormData(EMPTY_CHANNEL_NEWS);
    setFeedback(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.tag.trim()) {
      setFeedback({ type: 'error', message: 'Tytuł i tag są wymagane.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      icon: formData.icon,
      tag: formData.tag.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      news_date: formData.newsDate,
      sort_order: formData.sortOrder,
    };

    let result;
    if (isNew) {
      result = await supabase.from('channel_news').insert(payload);
    } else {
      result = await supabase.from('channel_news').update(payload).eq('id', editingId);
    }

    if (result.error) {
      setFeedback({ type: 'error', message: `Błąd: ${result.error.message}` });
    } else {
      bustDisciplinesCache();
      setFeedback({ type: 'success', message: isNew ? 'Aktualność utworzona!' : 'Aktualność zaktualizowana!' });
      setEditingId(null);
      setIsNew(false);
      setFormData(EMPTY_CHANNEL_NEWS);
      await fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const { error: err } = await supabase.from('channel_news').delete().eq('id', id);
    if (err) {
      setFeedback({ type: 'error', message: `Błąd usuwania: ${err.message}` });
    } else {
      bustDisciplinesCache();
      setFeedback({ type: 'success', message: 'Aktualność usunięta.' });
      setShowDeleteConfirm(null);
      await fetchItems();
    }
  };

  return (
    <div>
      {feedback && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground-950">
            {t('admin.channel_news_title')}
          </h2>
          <p className="text-sm text-foreground-500 mt-0.5">
            {t('admin.channel_news_count', { count: items.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-600 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line"></i>
          {t('admin.add_channel_news')}
        </button>
      </div>

      {loading && (
        <div className="text-center py-10">
          <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
            <i className="ri-loader-4-line text-xl"></i>
          </span>
          <p className="mt-2 text-sm text-foreground-500">{t('admin.loading')}</p>
        </div>
      )}
      {error && (
        <div className="text-center py-10">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={fetchItems} className="mt-2 text-sm text-primary-600 hover:underline cursor-pointer">{t('admin.retry')}</button>
        </div>
      )}

      {/* Edit Form */}
      {editingId !== null && (
        <div className="mb-6 rounded-xl border border-accent-300/50 bg-background-50 p-6">
          <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-4">
            {isNew ? t('admin.new_channel_news') : t('admin.edit_channel_news')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_title')}</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_tag')}</label>
              <input
                type="text"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="np. OGŁOSZENIE, TRANSMISJA"
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_icon')}</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_date')}</label>
              <input
                type="date"
                value={formData.newsDate}
                onChange={(e) => setFormData({ ...formData, newsDate: e.target.value })}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_sort_order')}</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30 resize-y"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-600 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <i className={`text-sm ${saving ? 'ri-loader-4-line animate-spin' : 'ri-check-line'}`}></i>
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-background-300 px-4 py-2 text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer"
            >
              {t('admin.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-background-200/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-100 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">{t('admin.col_title')}</th>
                <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{t('admin.col_tag')}</th>
                <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{t('admin.col_date')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('admin.col_order')}</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">{t('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-200/50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-background-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-50 text-primary-500">
                        <i className={`${item.icon} text-xs`}></i>
                      </span>
                      <span className="font-medium text-foreground-900 max-w-[200px] truncate">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-block rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">
                      {item.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-500 hidden md:table-cell whitespace-nowrap">{item.newsDate || '—'}</td>
                  <td className="px-4 py-3 text-foreground-500">{item.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-400 hover:bg-accent-50 hover:text-accent-600 transition-colors cursor-pointer"
                        title={t('admin.edit')}
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      {showDeleteConfirm === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            title={t('admin.confirm_delete')}
                          >
                            <i className="ri-check-line text-sm"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer"
                            title={t('admin.cancel')}
                          >
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title={t('admin.delete')}
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-foreground-400">
                    {t('admin.no_channel_news')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}