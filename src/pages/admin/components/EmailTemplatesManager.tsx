import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  description: string;
  updated_at: string;
}

interface EmailSetting {
  id: string;
  key: string;
  value: string;
}

interface TemplateHistory {
  id: string;
  template_name: string;
  changed_by: string;
  changed_at: string;
  old_subject: string;
  new_subject: string;
  old_body: string;
  new_body: string;
  change_type: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  'email-verification': 'Weryfikacja e-mail (rejestracja)',
  'password-reset': 'Resetowanie hasła',
  'verification-code': 'Kod weryfikacyjny (2FA)',
  'generic': 'Uniwersalna powiadomienie',
};

const SETTING_LABELS: Record<string, string> = {
  'logo_url': 'URL logotypu',
  'primary_color': 'Kolor główny (przyciski, nagłówek)',
  'secondary_color': 'Kolor tekstu nagłówków',
  'brand_name': 'Nazwa marki',
  'tagline': 'Slogan',
  'from_address': 'Adres nadawcy (From)',
  'footer_text': 'Tekst w stopce',
  'domain': 'Domena strony',
};

const AVAILABLE_VARS = [
  '{{logo_url}}',
  '{{primary_color}}',
  '{{secondary_color}}',
  '{{brand_name}}',
  '{{tagline}}',
  '{{footer_text}}',
  '{{action_url}}',
  '{{action_label}}',
  '{{code}}',
  '{{title}}',
  '{{message}}',
];

function applyTemplateVars(html: string, settings: EmailSetting[]): string {
  let result = html;
  settings.forEach((s) => {
    result = result.replace(new RegExp(`{{${s.key}}}`, 'g'), s.value);
  });
  return result;
}

export default function EmailTemplatesManager() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [settingsEdit, setSettingsEdit] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [history, setHistory] = useState<TemplateHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const saveMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss save messages
  useEffect(() => {
    if (saveMsg) {
      if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
      saveMsgTimerRef.current = setTimeout(() => setSaveMsg(null), 5000);
    }
    return () => {
      if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    };
  }, [saveMsg]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [templatesRes, settingsRes] = await Promise.all([
        supabase.from('email_templates').select('*').order('name'),
        supabase.from('email_settings').select('*').order('key'),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (settingsRes.error) throw settingsRes.error;

      const tpls = (templatesRes.data || []) as EmailTemplate[];
      const sets = (settingsRes.data || []) as EmailSetting[];
      setTemplates(tpls);
      setSettings(sets);

      const settingsMap: Record<string, string> = {};
      sets.forEach((s) => { settingsMap[s.key] = s.value; });
      setSettingsEdit(settingsMap);

      if (tpls.length > 0 && !activeTemplate) {
        setActiveTemplate(tpls[0].name);
        setEditedSubject(tpls[0].subject);
        setEditedBody(tpls[0].html_body);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, [activeTemplate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchHistory = useCallback(async (templateName: string) => {
    setLoadingHistory(true);
    try {
      const { data, error: histErr } = await supabase
        .from('email_template_history')
        .select('*')
        .eq('template_name', templateName)
        .order('changed_at', { ascending: false })
        .limit(20);

      if (histErr) throw histErr;
      setHistory((data || []) as TemplateHistory[]);
    } catch {
      setHistory([]);
    }
    setLoadingHistory(false);
  }, []);

  const selectTemplate = (name: string) => {
    const tpl = templates.find((t) => t.name === name);
    if (tpl) {
      setActiveTemplate(name);
      setEditedSubject(tpl.subject);
      setEditedBody(tpl.html_body);
      setSaveMsg(null);
      setShowPreview(false);
      fetchHistory(name);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMsg({ type: 'error', text: 'Wybierz plik obrazu (PNG, JPG, GIF, SVG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveMsg({ type: 'error', text: 'Obraz nie może przekraczać 5 MB.' });
      return;
    }

    setUploading(true);
    setSaveMsg(null);

    try {
      const fileName = `email-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadErr } = await supabase.storage
        .from('public')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('public').getPublicUrl(fileName);
      const imageUrl = urlData?.publicUrl;

      if (!imageUrl) throw new Error('Nie udało się pobrać URL obrazu.');

      const imgTag = `<img src="${imageUrl}" alt="" style="max-width:100%;height:auto;display:block;" />\n`;
      setEditedBody((prev) => prev + imgTag);
      setSaveMsg({ type: 'success', text: 'Obraz został przesłany i dodany do templatki.' });
    } catch (err: unknown) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Błąd przesyłania obrazu.' });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveTemplate = async () => {
    if (!activeTemplate) return;
    setSaving(true);
    setSaveMsg(null);

    const oldTpl = templates.find((t) => t.name === activeTemplate);

    try {
      const { error: saveErr } = await supabase
        .from('email_templates')
        .update({
          subject: editedSubject,
          html_body: editedBody,
          updated_at: new Date().toISOString(),
        })
        .eq('name', activeTemplate);

      if (saveErr) throw saveErr;

      // Record history
      if (oldTpl) {
        await supabase.from('email_template_history').insert({
          template_name: activeTemplate,
          changed_by: 'Admin',
          changed_at: new Date().toISOString(),
          old_subject: oldTpl.subject,
          new_subject: editedSubject,
          old_body: oldTpl.html_body,
          new_body: editedBody,
          change_type: 'update',
        });
      }

      setTemplates((prev) =>
        prev.map((t) =>
          t.name === activeTemplate
            ? { ...t, subject: editedSubject, html_body: editedBody, updated_at: new Date().toISOString() }
            : t
        )
      );
      setSaveMsg({ type: 'success', text: 'Templatka została zapisana.' });
      fetchHistory(activeTemplate);
    } catch (err: unknown) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Błąd zapisu.' });
    }
    setSaving(false);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSaveMsg(null);
    try {
      const updates = Object.entries(settingsEdit).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const upd of updates) {
        const { error: upsertErr } = await supabase
          .from('email_settings')
          .upsert(upd, { onConflict: 'key' });
        if (upsertErr) throw upsertErr;
      }

      const { data, error: refreshErr } = await supabase.from('email_settings').select('*');
      if (refreshErr) throw refreshErr;
      setSettings((data || []) as EmailSetting[]);

      setSaveMsg({ type: 'success', text: 'Ustawienia globalne zapisane.' });
    } catch (err: unknown) {
      setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Błąd zapisu ustawień.' });
    }
    setSavingSettings(false);
  };

  const currentTemplate = templates.find((t) => t.name === activeTemplate);
  const previewHtml = currentTemplate
    ? applyTemplateVars(editedBody, settings)
    : '';
  const getMailIconClass = (name: string) =>
    activeTemplate === name
      ? 'ri-mail-send-fill text-primary-600 text-sm'
      : 'ri-mail-line text-foreground-400 text-sm';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
          <i className="ri-loader-4-line text-2xl"></i>
        </span>
        <p className="text-sm text-foreground-500">Ładowanie templatek mailowych...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-400">
          <i className="ri-error-warning-line text-2xl"></i>
        </span>
        <p className="text-sm text-red-600">Błąd ładowania templatek</p>
        <p className="text-xs text-foreground-400 font-mono">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-xs font-semibold text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-refresh-line text-xs"></i>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground-950">Templateki mailowe</h2>
          <p className="text-xs text-foreground-500 mt-0.5">
            Edytuj wygląd wiadomości wysyłanych do użytkowników. Zmiany są natychmiastowe — nie trzeba redeployować.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-xs font-semibold text-foreground-500 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap self-start"
        >
          <i className="ri-refresh-line text-xs"></i>
          Odśwież
        </button>
      </div>

      {/* Save status — auto-dismiss */}
      {saveMsg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 animate-in ${
            saveMsg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <i className={saveMsg.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
          {saveMsg.text}
          <button
            onClick={() => setSaveMsg(null)}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded hover:bg-black/5 cursor-pointer"
          >
            <i className="ri-close-line text-xs"></i>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Template selector + Global settings */}
        <div className="xl:col-span-1 space-y-6">
          {/* Templates list */}
          <div className="rounded-xl border border-background-200/70 bg-background-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-background-200/70 bg-background-100">
              <h3 className="text-sm font-semibold text-foreground-800">Dostępne templatki</h3>
            </div>
            <div className="divide-y divide-background-200/50">
              {templates.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => selectTemplate(tpl.name)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    activeTemplate === tpl.name
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-background-100 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className={getMailIconClass(tpl.name)}></i>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${activeTemplate === tpl.name ? 'text-primary-700' : 'text-foreground-700'}`}>
                        {TEMPLATE_LABELS[tpl.name] || tpl.name}
                      </p>
                      <p className="text-[11px] text-foreground-400 truncate">{tpl.subject}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Global settings */}
          <div className="rounded-xl border border-background-200/70 bg-background-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-background-200/70 bg-background-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground-800">Ustawienia globalne</h3>
              <span className="text-[10px] text-foreground-400 bg-background-200/50 px-2 py-0.5 rounded-full">{settings.length} wpisów</span>
            </div>
            <div className="p-4 space-y-3">
              {settings.map((s) => (
                <div key={s.key}>
                  <label className="block text-xs font-medium text-foreground-600 mb-1">
                    {SETTING_LABELS[s.key] || s.key}
                  </label>
                  {s.key === 'primary_color' || s.key === 'secondary_color' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settingsEdit[s.key] || s.value}
                        onChange={(e) => setSettingsEdit((prev) => ({ ...prev, [s.key]: e.target.value }))}
                        className="h-9 w-12 rounded cursor-pointer border border-background-200"
                      />
                      <input
                        type="text"
                        value={settingsEdit[s.key] || s.value}
                        onChange={(e) => setSettingsEdit((prev) => ({ ...prev, [s.key]: e.target.value }))}
                        className="flex-1 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                      />
                    </div>
                  ) : s.key === 'logo_url' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settingsEdit[s.key] || s.value}
                        onChange={(e) => setSettingsEdit((prev) => ({ ...prev, [s.key]: e.target.value }))}
                        className="flex-1 rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                        placeholder="https://..."
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith('image/')) {
                            setSaveMsg({ type: 'error', text: 'Wybierz plik obrazu (PNG, JPG, GIF, SVG).' });
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            setSaveMsg({ type: 'error', text: 'Obraz nie może przekraczać 5 MB.' });
                            return;
                          }
                          setUploading(true);
                          setSaveMsg(null);
                          try {
                            const fileName = `email-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                            const { error: uploadErr } = await supabase.storage.from('public').upload(fileName, file, { upsert: true });
                            if (uploadErr) throw uploadErr;
                            const { data: urlData } = supabase.storage.from('public').getPublicUrl(fileName);
                            const imageUrl = urlData?.publicUrl;
                            if (!imageUrl) throw new Error('Nie udało się pobrać URL obrazu.');
                            setSettingsEdit((prev) => ({ ...prev, logo_url: imageUrl }));
                            setSaveMsg({ type: 'success', text: 'Logotyp przesłany! Kliknij "Zapisz ustawienia globalne" poniżej aby zapisać.' });
                          } catch (err: unknown) {
                            setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Błąd przesyłania.' });
                          }
                          setUploading(false);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-xs font-semibold text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                        title="Prześlij logotyp z urządzenia"
                      >
                        {uploading ? (
                          <i className="ri-loader-4-line animate-spin text-xs"></i>
                        ) : (
                          <i className="ri-upload-cloud-2-line text-xs"></i>
                        )}
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={settingsEdit[s.key] || s.value}
                      onChange={(e) => setSettingsEdit((prev) => ({ ...prev, [s.key]: e.target.value }))}
                      className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full rounded-md bg-primary-500 py-2 text-sm font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {savingSettings ? (
                  <span className="inline-flex items-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Zapisywanie...
                  </span>
                ) : (
                  'Zapisz ustawienia globalne'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Editor + Preview + History */}
        <div className="xl:col-span-2 space-y-4">
          {currentTemplate && (
            <>
              <div className="rounded-xl border border-background-200/70 bg-background-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-background-200/70 bg-background-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground-800">
                      {TEMPLATE_LABELS[currentTemplate.name] || currentTemplate.name}
                    </h3>
                    <span className="text-[10px] text-foreground-400">
                      Ostatnia zmiana: {new Date(currentTemplate.updated_at).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowPreview((p) => !p)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        showPreview
                          ? 'bg-primary-100 text-primary-700 border border-primary-200'
                          : 'border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100'
                      }`}
                    >
                      <i className={showPreview ? 'ri-eye-fill' : 'ri-eye-line'}></i>
                      {showPreview ? 'Ukryj podgląd' : 'Podgląd'}
                    </button>
                    <button
                      type="button"
                      onClick={saveTemplate}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-1.5 text-xs font-semibold text-background-50 dark:text-foreground-950 hover:bg-primary-600 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
                    >
                      {saving ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i>
                          Zapis...
                        </>
                      ) : (
                        <>
                          <i className="ri-save-line"></i>
                          Zapisz templatkę
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 mb-1">
                      Temat wiadomości
                    </label>
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                    />
                  </div>

                  {/* Available vars hint */}
                  <div className="rounded-lg bg-background-100 border border-background-200/70 p-3">
                    <p className="text-xs font-semibold text-foreground-600 mb-2">Dostępne zmienne (wklej w HTML):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_VARS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setEditedBody((prev) => prev + v);
                          }}
                          className="inline-flex items-center rounded-md bg-secondary-100 px-2 py-1 text-[11px] font-mono text-secondary-800 hover:bg-secondary-200 transition-colors cursor-pointer"
                          title="Kliknij, aby wstawić"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HTML Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-foreground-700">
                        Treść HTML
                      </label>
                      <div className="flex items-center gap-2">
                        {/* Image upload button */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-1.5 text-xs font-semibold text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                        >
                          {uploading ? (
                            <>
                              <i className="ri-loader-4-line animate-spin"></i>
                              Przesyłanie...
                            </>
                          ) : (
                            <>
                              <i className="ri-image-add-line"></i>
                              Dodaj obrazek
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      rows={18}
                      className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-xs font-mono text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="rounded-xl border border-background-200/70 bg-background-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-background-200/70 bg-background-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground-800">Podgląd na żywo</h3>
                    <span className="text-[10px] text-foreground-400">Zmienne zastąpione realnymi wartościami</span>
                  </div>
                  <div className="p-4">
                    <div
                      className="rounded-lg border border-background-200/70 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </div>
              )}

              {/* History */}
              <div className="rounded-xl border border-background-200/70 bg-background-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-background-200/70 bg-background-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground-800">Historia zmian</h3>
                  <button
                    type="button"
                    onClick={() => fetchHistory(currentTemplate.name)}
                    className="inline-flex items-center gap-1 text-xs text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-refresh-line text-xs"></i>
                    Odśwież
                  </button>
                </div>
                <div className="divide-y divide-background-200/50 max-h-64 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="px-4 py-6 text-center text-xs text-foreground-400">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Ładowanie historii...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-foreground-400">
                      <i className="ri-history-line text-base block mb-1 opacity-40"></i>
                      Brak zapisanych zmian dla tej templatki.
                    </div>
                  ) : (
                    history.map((h) => (
                      <div key={h.id} className="px-4 py-3 hover:bg-background-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary-100">
                            <i className="ri-pencil-line text-[10px] text-secondary-600"></i>
                          </span>
                          <span className="text-xs font-semibold text-foreground-700">{h.changed_by || 'Admin'}</span>
                          <span className="text-[10px] text-foreground-400">
                            {new Date(h.changed_at).toLocaleString('pl-PL')}
                          </span>
                        </div>
                        <div className="ml-7 space-y-1">
                          {h.old_subject !== h.new_subject && (
                            <p className="text-[11px] text-foreground-500">
                              Temat: <span className="text-red-400 line-through">{h.old_subject.slice(0, 60)}{h.old_subject.length > 60 ? '...' : ''}</span> → <span className="text-green-600">{h.new_subject.slice(0, 60)}{h.new_subject.length > 60 ? '...' : ''}</span>
                            </p>
                          )}
                          {h.old_body !== h.new_body && (
                            <p className="text-[11px] text-foreground-400">
                              Treść HTML — wprowadzono zmiany
                            </p>
                          )}
                          {h.old_subject === h.new_subject && h.old_body === h.new_body && (
                            <p className="text-[11px] text-foreground-400">Zapisano bez zmian</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}