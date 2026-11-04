import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface ModeratorRow {
  id: string;
  name: string;
  image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface ModeratorFormData {
  name: string;
  image_url: string;
  display_order: number;
}

const EMPTY_FORM: ModeratorFormData = {
  name: '',
  image_url: '',
  display_order: 0,
};

export default function ModeratorsManager() {
  const { t } = useTranslation();
  const [moderators, setModerators] = useState<ModeratorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModeratorFormData>(EMPTY_FORM);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  const fetchModerators = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('moderators')
      .select('*')
      .order('display_order', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setModerators((data as ModeratorRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModerators();
  }, [fetchModerators]);

  const handleEdit = (mod: ModeratorRow) => {
    setEditingId(mod.id);
    setIsNew(false);
    setFormData({
      name: mod.name,
      image_url: mod.image_url || '',
      display_order: mod.display_order || 0,
    });
    setImagePreview(mod.image_url || '');
    setFeedback(null);
  };

  const handleNew = () => {
    setEditingId('__new__');
    setIsNew(true);
    const maxOrder = moderators.reduce((max, m) => Math.max(max, m.display_order || 0), 0);
    setFormData({ ...EMPTY_FORM, display_order: maxOrder + 1 });
    setImagePreview('');
    setFeedback(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsNew(false);
    setFormData(EMPTY_FORM);
    setImagePreview('');
    setFeedback(null);
  };

  const handleImageUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
    setImagePreview(url);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: t('admin.mod_name_required') });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      name: formData.name.trim(),
      image_url: formData.image_url.trim(),
      display_order: formData.display_order,
    };

    let result;
    if (isNew) {
      result = await supabase.from('moderators').insert(payload);
    } else {
      result = await supabase.from('moderators').update(payload).eq('id', editingId);
    }

    if (result.error) {
      setFeedback({ type: 'error', message: result.error.message });
      setSaving(false);
      return;
    }

    setFeedback({ type: 'success', message: isNew ? t('admin.mod_created') : t('admin.mod_updated') });
    setEditingId(null);
    setIsNew(false);
    setFormData(EMPTY_FORM);
    setImagePreview('');
    setSaving(false);
    await fetchModerators();
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('moderators').delete().eq('id', id);
    if (err) {
      setFeedback({ type: 'error', message: err.message });
    } else {
      setFeedback({ type: 'success', message: t('admin.mod_deleted') });
      setShowDeleteConfirm(null);
      await fetchModerators();
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
            {t('admin.mod_title')}
          </h2>
          <p className="text-sm text-foreground-500 mt-0.5">
            {t('admin.mod_count', { count: moderators.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line"></i>
          {t('admin.mod_add')}
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
          <button type="button" onClick={fetchModerators} className="mt-2 text-sm text-primary-600 hover:underline cursor-pointer">
            {t('admin.retry')}
          </button>
        </div>
      )}

      {editingId && (
        <div className="mb-6 rounded-xl border border-primary-300/50 bg-background-50 p-6">
          <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-4">
            {isNew ? t('admin.mod_new') : t('admin.mod_edit')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.mod_field_name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Andrzej Wędkarz"
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.mod_field_order')}</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.mod_field_image')}</label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {imagePreview && (
                <div className="relative group w-24 h-24 rounded-lg overflow-hidden border-2 border-background-200/70 bg-background-100 flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Podgląd"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleImageUrlChange('')}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title={t('admin.upload_remove')}
                  >
                    <i className="ri-close-line text-[10px]"></i>
                  </button>
                </div>
              )}
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://storage.readdy-site.link/..."
                  className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                />
                <p className="mt-1 text-[11px] text-foreground-400">{t('admin.mod_field_image_hint')}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-50 whitespace-nowrap cursor-pointer"
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

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-background-200/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-100 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap w-12">{t('admin.mod_col_image')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('admin.mod_col_name')}</th>
                <th className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">{t('admin.col_order')}</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">{t('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-200/50">
              {moderators.map((mod) => (
                <tr key={mod.id} className="hover:bg-background-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-background-100 flex items-center justify-center">
                      {mod.image_url ? (
                        <img src={mod.image_url} alt={mod.name} className="h-full w-full object-contain" />
                      ) : (
                        <i className="ri-shield-star-line text-foreground-300 text-sm"></i>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground-900">{mod.name}</td>
                  <td className="px-4 py-3 text-foreground-500 hidden sm:table-cell">{mod.display_order}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(mod)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-400 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer"
                        title={t('admin.edit')}
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      {showDeleteConfirm === mod.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(mod.id)}
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
                          onClick={() => setShowDeleteConfirm(mod.id)}
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
              {moderators.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-foreground-400">
                    {t('admin.mod_empty')}
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