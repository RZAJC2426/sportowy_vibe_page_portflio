import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { bustArticleCache } from '@/data/articles';

// ─── Storage upload via edge function ───────────────────────────────────────
// Images go through: compress → edge function → Supabase Storage → public URL.
// Only the resulting URL string is saved in articles.image, keeping the
// database payload tiny and avoiding 502 proxy timeouts.

interface CompressParams {
  maxWidth: number;
  quality: number;
}

const COMPRESSION_ATTEMPTS: CompressParams[] = [
  { maxWidth: 1200, quality: 0.72 },
  { maxWidth: 1000, quality: 0.65 },
  { maxWidth: 800, quality: 0.58 },
];

async function compressImageToBlob(file: File, params: CompressParams): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > params.maxWidth) {
        height = Math.round((height * params.maxWidth) / width);
        width = params.maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        params.quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Uploads an image file to Supabase Storage via the article-image-upload
 * edge function. Returns the public URL of the uploaded image.
 *
 * Flow: compress → base64 → edge function (service key) → Storage bucket
 *       → returns public URL → saved as plain string in articles.image
 */
async function uploadImageToStorage(file: File): Promise<string> {
  console.log('[ImageUpload] Starting — file:', file.name, file.type, Math.round(file.size / 1024) + 'KB');

  // Step 1 — compress to a reasonable webp blob
  let bestBlob: Blob | null = null;
  let bestSize = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < COMPRESSION_ATTEMPTS.length; i++) {
    const attempt = COMPRESSION_ATTEMPTS[i];
    try {
      const blob = await compressImageToBlob(file, attempt);
      console.log(`[ImageUpload] Attempt ${i + 1}: ${attempt.maxWidth}px / q${attempt.quality} → ${Math.round(blob.size / 1024)}KB`);

      if (blob.size < bestSize) {
        bestSize = blob.size;
        bestBlob = blob;
      }

      // Good-enough size — stop early
      if (blob.size <= 300 * 1024) {
        break;
      }
    } catch (canvasErr: unknown) {
      const msg = canvasErr instanceof Error ? canvasErr.message : 'Canvas error';
      console.warn(`[ImageUpload] Compression attempt ${i + 1} failed:`, msg);
    }
  }

  if (!bestBlob) {
    throw new Error('Nie udało się skompresować obrazka — spróbuj mniejszego pliku.');
  }

  // Step 2 — convert to base64 for the edge function call
  const dataUrl = await blobToBase64(bestBlob);
  console.log('[ImageUpload] Base64 for edge function:', Math.round(dataUrl.length / 1024) + 'KB');

  // Step 3 — call edge function (uploads to storage with service key)
  console.log('[ImageUpload] Invoking article-image-upload edge function...');
  const { data, error } = await supabase.functions.invoke('article-image-upload', {
    body: {
      imageBase64: dataUrl,
      fileName: file.name || `article-${Date.now()}.webp`,
      contentType: 'image/webp',
    },
  });

  if (error) {
    console.error('[ImageUpload] Edge function error:', error);
    throw new Error(`Błąd wysyłania obrazka: ${error.message || 'nieznany błąd'}`);
  }

  // The edge function always returns 200; check for error in body
  const result = data as { url?: string; error?: string };

  if (result.error || !result.url) {
    console.error('[ImageUpload] Edge function returned error:', result.error);
    throw new Error(result.error || 'Edge function nie zwrócił URL-a');
  }

  console.log('[ImageUpload] DONE — public URL:', result.url);
  return result.url;
}

interface ArticleRow {
  slug: string;
  title: string;
  discipline: string;
  discipline_slug: string;
  date: string;
  summary: string;
  content: string;
  image: string;
  featured: boolean;
  gallery: string[];
}

interface ArticleFormData {
  slug: string;
  title: string;
  discipline: string;
  discipline_slug: string;
  date: string;
  summary: string;
  content: string;
  image: string;
  image_caption: string;
  featured: boolean;
  gallery: string[];
}

const EMPTY_FORM: ArticleFormData = {
  slug: '',
  title: '',
  discipline: '',
  discipline_slug: '',
  date: new Date().toISOString().split('T')[0],
  summary: '',
  content: '',
  image: '',
  image_caption: '',
  featured: false,
  gallery: [],
};

const DISCIPLINE_OPTIONS = [
  { name: 'Tenis', slug: 'tenis' },
  { name: 'Siatkówka', slug: 'siatkowka' },
  { name: 'Piłka Nożna', slug: 'pilka-nozna' },
  { name: 'Koszykówka', slug: 'koszykowka' },
  { name: 'Hokej na lodzie', slug: 'hokej' },
  { name: 'Skoki Narciarskie', slug: 'skoki-narciarskie' },
  { name: 'Inne dyscypliny', slug: 'inne' },
  { name: 'Nasz Kanał', slug: 'nasz-kanal' },
];

export default function ArticlesManager() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>(EMPTY_FORM);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Text formatting helpers ───
  function getTextareaSelection(ta: HTMLTextAreaElement): { start: number; end: number; text: string } {
    return { start: ta.selectionStart, end: ta.selectionEnd, text: ta.value.substring(ta.selectionStart, ta.selectionEnd) };
  }

  function wrapSelection(ta: HTMLTextAreaElement, open: string, close: string) {
    const { start, end, text } = getTextareaSelection(ta);
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    const replacement = open + text + close;
    ta.value = before + replacement + after;
    ta.selectionStart = start + open.length;
    ta.selectionEnd = start + open.length + text.length;
    setFormData((prev) => ({ ...prev, content: ta.value }));
    ta.focus();
  }

  function wrapBlock(ta: HTMLTextAreaElement, open: string, close: string) {
    const { start, end, text } = getTextareaSelection(ta);
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    const replacement = open + '\n' + (text || 'Treść') + '\n' + close;
    ta.value = before + replacement + after;
    ta.selectionStart = start + open.length + 1;
    ta.selectionEnd = start + open.length + 1 + (text || 'Treść').length;
    setFormData((prev) => ({ ...prev, content: ta.value }));
    ta.focus();
  }

  function wrapLines(ta: HTMLTextAreaElement, lineOpen: string, lineClose: string, listOpen: string, listClose: string) {
    const { start, end, text } = getTextareaSelection(ta);
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    const wrapped = lines.length > 0
      ? lines.map((l) => lineOpen + l.trim() + lineClose).join('\n')
      : lineOpen + 'Element listy' + lineClose;
    const replacement = listOpen + '\n' + wrapped + '\n' + listClose;
    ta.value = before + replacement + after;
    ta.selectionStart = start + replacement.length;
    ta.selectionEnd = start + replacement.length;
    setFormData((prev) => ({ ...prev, content: ta.value }));
    ta.focus();
  }

  function handleToolbarAction(action: string) {
    const ta = contentTextareaRef.current;
    if (!ta) return;
    switch (action) {
      case 'bold':
        wrapSelection(ta, '<strong>', '</strong>');
        break;
      case 'italic':
        wrapSelection(ta, '<em>', '</em>');
        break;
      case 'ul':
        wrapLines(ta, '<li>', '</li>', '<ul>', '</ul>');
        break;
      case 'ol':
        wrapLines(ta, '<li>', '</li>', '<ol>', '</ol>');
        break;
      case 'p':
        wrapSelection(ta, '<p>', '</p>');
        break;
      case 'br':
        wrapSelection(ta, '', '<br />\n');
        break;
      case 'blockquote':
        wrapBlock(ta, '<blockquote>', '</blockquote>');
        break;
      case 'link': {
        const url = window.prompt('Wklej adres URL (np. https://example.com):', 'https://');
        if (url && url !== 'https://') {
          const { start, end, text } = getTextareaSelection(ta);
          const label = text || 'Link';
          const before = ta.value.substring(0, start);
          const after = ta.value.substring(end);
          const replacement = `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
          ta.value = before + replacement + after;
          ta.selectionStart = start + replacement.length;
          ta.selectionEnd = start + replacement.length;
          setFormData((prev) => ({ ...prev, content: ta.value }));
          ta.focus();
        }
        break;
      }
      default:
        break;
    }
  }

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('articles')
      .select('slug, title, discipline, discipline_slug, date, summary, content, image, featured, gallery')
      .order('date', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setArticles((data as ArticleRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleEdit = (article: ArticleRow) => {
    setEditingSlug(article.slug);
    setIsNew(false);
    setFormData({
      slug: article.slug,
      title: article.title,
      discipline: article.discipline,
      discipline_slug: article.discipline_slug,
      date: article.date,
      summary: article.summary,
      content: article.content || '',
      image: article.image,
      image_caption: (article as any).image_caption || '',
      featured: article.featured,
      gallery: article.gallery || [],
    });
    setPendingImageFile(null);
    setImagePreviewUrl(null);
    setFeedback(null);
  };

  const handleNew = () => {
    setEditingSlug('__new__');
    setIsNew(true);
    setFormData({
      ...EMPTY_FORM,
      date: new Date().toISOString().split('T')[0],
    });
    setPendingImageFile(null);
    setImagePreviewUrl(null);
    setFeedback(null);
  };

  const handleCancel = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setEditingSlug(null);
    setIsNew(false);
    setFormData(EMPTY_FORM);
    setFeedback(null);
    setUploading(false);
    setDragOver(false);
    setPendingImageFile(null);
    setImagePreviewUrl(null);
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);
  };

  const handleImageSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: t('admin.upload_too_big') });
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setFeedback({ type: 'error', message: t('admin.upload_invalid_format') });
      return;
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

    setPendingImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setFormData((prev) => ({ ...prev, image: '' }));
    setFeedback(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setPendingImageFile(null);
    setImagePreviewUrl(null);
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.discipline_slug.trim()) {
      setFeedback({ type: 'error', message: 'Tytuł i slug dyscypliny są wymagane.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const slug = isNew ? generateSlug(formData.title) : formData.slug;
    let finalImageUrl = formData.image.trim();
    let imageUploadFailed = false;

    // Upload image to Supabase Storage via edge function — only the
    // resulting public URL is saved in articles.image (tiny payload, no 502).
    if (pendingImageFile) {
      try {
        setUploading(true);
        setFeedback(null);
        console.log('[ImageUpload] Starting — file:', pendingImageFile.name, pendingImageFile.type, Math.round(pendingImageFile.size / 1024) + 'KB');
        finalImageUrl = await uploadImageToStorage(pendingImageFile);
        console.log('[ImageUpload] DONE — storage URL:', finalImageUrl);

        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setPendingImageFile(null);
        setImagePreviewUrl(null);
        setFeedback(null);
      } catch (uploadErr: unknown) {
        const msg = uploadErr instanceof Error ? uploadErr.message : 'Nieznany błąd';
        console.error('[ImageUpload] CRASHED:', uploadErr);
        imageUploadFailed = true;
        finalImageUrl = '';
        // Keep the error visible — don't overwrite with generic "bez obrazka" later.
        setFeedback({
          type: 'error',
          message: `Błąd przetwarzania obrazka: ${msg}`,
        });
      } finally {
        setUploading(false);
      }
    }

    // Save article to Supabase
    const payload = {
      slug,
      title: formData.title.trim(),
      discipline: formData.discipline.trim(),
      discipline_slug: formData.discipline_slug.trim(),
      date: formData.date,
      summary: formData.summary.trim(),
      content: formData.content.trim(),
      image: finalImageUrl,
      image_caption: formData.image_caption.trim(),
      featured: formData.featured,
      gallery: formData.gallery.filter((url) => url.trim() !== ''),
    };

    console.log('[Save] Payload image URL:', finalImageUrl);

    let result;
    try {
      if (isNew) {
        result = await supabase.from('articles').insert(payload);
      } else {
        result = await supabase.from('articles').update(payload).eq('slug', editingSlug);
      }
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      console.error('[Save] Network-level error:', msg);
      setFeedback({
        type: 'error',
        message: `Błąd sieciowy podczas zapisywania: ${msg}. Spróbuj ponownie.`,
      });
      setSaving(false);
      return;
    }

    if (result.error) {
      const errMsg = result.error.message || String(result.error);
      console.error('[Save] Supabase error:', result.error);
      setFeedback({ type: 'error', message: `Błąd zapisu artykułu: ${errMsg}` });
      setSaving(false);
      return;
    }

    bustArticleCache();
    // Don't overwrite a specific image error with a generic message.
    if (imageUploadFailed) {
      setFeedback((prev) => ({
        type: 'error' as const,
        message: (prev ? prev.message + ' ' : '') + (isNew ? 'Artykuł utworzony — ale bez obrazka. Spróbuj ponownie dodać zdjęcie.' : 'Artykuł zaktualizowany — ale bez obrazka. Spróbuj ponownie dodać zdjęcie.'),
      }));
    } else {
      setFeedback({ type: 'success', message: isNew ? 'Artykuł utworzony!' : 'Artykuł zaktualizowany!' });
    }
    setEditingSlug(null);
    setIsNew(false);
    setFormData(EMPTY_FORM);
    setPendingImageFile(null);
    setImagePreviewUrl(null);
    setSaving(false);
    await fetchArticles();
  };

  const handleDelete = async (slug: string) => {
    const { error: err } = await supabase.from('articles').delete().eq('slug', slug);
    if (err) {
      setFeedback({ type: 'error', message: `Błąd usuwania: ${err.message}` });
    } else {
      bustArticleCache();
      setFeedback({ type: 'success', message: 'Artykuł usunięty.' });
      setShowDeleteConfirm(null);
      await fetchArticles();
    }
  };

  const displayImage = imagePreviewUrl || formData.image;

  return (
    <div>
      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground-950">
            {t('admin.articles_title')}
          </h2>
          <p className="text-sm text-foreground-500 mt-0.5">
            {t('admin.articles_count', { count: articles.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-600 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line"></i>
          {t('admin.add_article')}
        </button>
      </div>

      {/* Loading / Error */}
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
          <button type="button" onClick={fetchArticles} className="mt-2 text-sm text-primary-600 hover:underline cursor-pointer">
            {t('admin.retry')}
          </button>
        </div>
      )}

      {/* Edit Form */}
      {editingSlug && (
        <div className="mb-6 rounded-xl border border-primary-300/50 bg-background-50 p-6">
          <h3 className="font-heading text-lg font-semibold text-foreground-900 mb-4">
            {isNew ? t('admin.new_article') : t('admin.edit_article')}
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
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_discipline_slug')}</label>
              <select
                value={formData.discipline_slug}
                onChange={(e) => {
                  const opt = DISCIPLINE_OPTIONS.find((o) => o.slug === e.target.value);
                  setFormData({ ...formData, discipline_slug: e.target.value, discipline: opt?.name || '' });
                }}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              >
                <option value="">— Wybierz —</option>
                {DISCIPLINE_OPTIONS.map((opt) => (
                  <option key={opt.slug} value={opt.slug}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_discipline_name')}</label>
              <input
                type="text"
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_date')}</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="featured-check"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="h-4 w-4 rounded border-background-300 text-primary-500 focus:ring-primary-400"
              />
              <label htmlFor="featured-check" className="text-sm text-foreground-700 cursor-pointer">
                {t('admin.field_featured')}
              </label>
            </div>
          </div>

          {/* ───── Image Upload Section ───── */}
          <div className="mt-5">
            <label className="block text-xs font-semibold text-foreground-700 mb-2">{t('admin.field_image')}</label>

            {displayImage ? (
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative group w-full sm:w-64 h-40 rounded-lg overflow-hidden border-2 border-background-200/70 bg-background-100">
                  <img
                    src={displayImage}
                    alt="Podgląd obrazka"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title={t('admin.upload_remove')}
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground-500 mb-2 truncate">
                    {pendingImageFile ? pendingImageFile.name : formData.image}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-background-300 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-image-edit-line"></i>
                    {t('admin.upload_replace')}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer ${
                  dragOver
                    ? 'border-primary-400 bg-primary-50/50'
                    : 'border-background-300 hover:border-primary-300 hover:bg-background-50'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-500 animate-spin">
                      <i className="ri-loader-4-line text-xl"></i>
                    </span>
                    <p className="text-sm text-foreground-600 font-medium">{t('admin.upload_uploading')}</p>
                  </div>
                ) : (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-foreground-400 mb-3">
                      <i className="ri-image-add-line text-2xl"></i>
                    </span>
                    <p className="text-sm font-medium text-foreground-700">{t('admin.upload_drop_title')}</p>
                    <p className="text-xs text-foreground-400 mt-1">{t('admin.upload_drop_hint')}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-upload-line"></i>
                      {t('admin.upload_browse')}
                    </button>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mt-3">
              <p className="text-[11px] text-foreground-400 mb-1">{t('admin.field_image_url')}</p>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>

            {/* Image caption */}
            <div className="mt-3">
              <p className="text-[11px] text-foreground-400 mb-1">Podpis zdjęcia (autor / źródło)</p>
              <input
                type="text"
                value={formData.image_caption}
                onChange={(e) => setFormData({ ...formData, image_caption: e.target.value })}
                placeholder="np. Fot. Anna Kowalska / Sportowy Vibe"
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_summary')}</label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_content')}</label>
            {/* Formatting toolbar */}
            <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md border border-background-200 bg-background-100 px-2 py-1.5">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-foreground-400">Formatowanie:</span>
              <button
                type="button"
                onClick={() => handleToolbarAction('bold')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Pogrubienie"
              >
                <i className="ri-bold text-sm"></i>
              </button>
              <button
                type="button"
                onClick={() => handleToolbarAction('italic')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Kursywa"
              >
                <i className="ri-italic text-sm"></i>
              </button>
              <span className="mx-1 h-4 w-px bg-background-300/60" />
              <button
                type="button"
                onClick={() => handleToolbarAction('p')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Akapit"
              >
                <i className="ri-paragraph text-sm"></i>
              </button>
              <button
                type="button"
                onClick={() => handleToolbarAction('br')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Nowa linia"
              >
                <i className="ri-text-wrap text-sm"></i>
              </button>
              <button
                type="button"
                onClick={() => handleToolbarAction('blockquote')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Wcięcie / cytat blokowy"
              >
                <i className="ri-indent-increase text-sm"></i>
              </button>
              <span className="mx-1 h-4 w-px bg-background-300/60" />
              <button
                type="button"
                onClick={() => handleToolbarAction('ul')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Lista punktowana"
              >
                <i className="ri-list-unordered text-sm"></i>
              </button>
              <button
                type="button"
                onClick={() => handleToolbarAction('ol')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Lista numerowana"
              >
                <i className="ri-list-ordered text-sm"></i>
              </button>
              <span className="mx-1 h-4 w-px bg-background-300/60" />
              <button
                type="button"
                onClick={() => handleToolbarAction('link')}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-600 hover:bg-background-200 hover:text-foreground-900 transition-colors"
                title="Link"
              >
                <i className="ri-link text-sm"></i>
              </button>
            </div>
            <textarea
              ref={contentTextareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30 resize-y font-mono"
              placeholder="Tu wpisz treść artykułu. Możesz używać tagów HTML do formatowania..."
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-foreground-700 mb-1">{t('admin.field_gallery')}</label>
            <p className="text-[11px] text-foreground-400 mb-2">{t('admin.field_gallery_hint')}</p>
            <div className="space-y-2">
              {formData.gallery.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      const updated = [...formData.gallery];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, gallery: updated });
                    }}
                    placeholder="https://..."
                    className="flex-1 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.gallery.filter((_, i) => i !== idx);
                      setFormData({ ...formData, gallery: updated });
                    }}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-foreground-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    title={t('admin.delete')}
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gallery: [...formData.gallery, ''] })}
                className="inline-flex items-center gap-1.5 rounded-md border border-background-300 px-3 py-1.5 text-xs font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line text-sm"></i>
                {t('admin.add_gallery_image')}
              </button>
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

      {/* Articles Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-background-200/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-100 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">{t('admin.col_title')}</th>
                <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{t('admin.col_discipline')}</th>
                <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{t('admin.col_date')}</th>
                <th className="px-4 py-3 whitespace-nowrap">{t('admin.col_featured')}</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">{t('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-200/50">
              {articles.map((article) => (
                <tr key={article.slug} className="hover:bg-background-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground-900 max-w-[200px] truncate" title={article.title}>
                    {article.title}
                  </td>
                  <td className="px-4 py-3 text-foreground-500 hidden md:table-cell whitespace-nowrap">{article.discipline}</td>
                  <td className="px-4 py-3 text-foreground-500 hidden md:table-cell whitespace-nowrap">{article.date}</td>
                  <td className="px-4 py-3">
                    {article.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold text-accent-700">
                        <i className="ri-star-fill text-[8px]"></i> TAK
                      </span>
                    ) : (
                      <span className="text-foreground-400 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(article)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-400 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer"
                        title={t('admin.edit')}
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      {showDeleteConfirm === article.slug ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(article.slug)}
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
                          onClick={() => setShowDeleteConfirm(article.slug)}
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
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-foreground-400">
                    {t('admin.no_articles')}
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