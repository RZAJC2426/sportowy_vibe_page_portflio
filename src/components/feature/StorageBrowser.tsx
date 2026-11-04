import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface StorageFile {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, unknown> | null;
}

interface StorageBrowserProps {
  currentUrl: string;
  onSelect: (url: string) => void;
  onCancel: () => void;
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.ico', '.avif'];

// Known public buckets in this project. listBuckets() requires storage-admin
// privileges that the public/authenticated key does NOT have, so it usually
// returns an empty array — which made the browser open blank. We always seed
// these known buckets and merge in anything listBuckets() manages to return.
const KNOWN_BUCKETS = ['article-images', 'avatars'];

function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function StorageBrowser({ currentUrl, onSelect, onCancel }: StorageBrowserProps) {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [subfolders, setSubfolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const loadedRef = useRef(false);

  // Load buckets on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      setLoading(true);
      try {
        // Start from known buckets, then try to enrich with listBuckets().
        const names = [...KNOWN_BUCKETS];
        try {
          const { data } = await supabase.storage.listBuckets();
          if (data && data.length > 0) {
            for (const b of data) {
              if (!names.includes(b.name)) names.push(b.name);
            }
          }
        } catch {
          // listBuckets not permitted for this key — fine, we keep KNOWN_BUCKETS.
        }

        setBuckets(names);

        // Auto-select the bucket that matches any part of the current URL
        if (currentUrl) {
          const matchingBucket = names.find((n) => currentUrl.includes(`/${n}/`));
          if (matchingBucket) {
            setSelectedBucket(matchingBucket);
            const bucketIdx = currentUrl.indexOf(`/${matchingBucket}/`);
            if (bucketIdx !== -1) {
              const afterBucket = currentUrl.slice(bucketIdx + matchingBucket.length + 2);
              const fileNameIdx = afterBucket.lastIndexOf('/');
              if (fileNameIdx !== -1) {
                const folders = afterBucket.slice(0, fileNameIdx).split('/').filter(Boolean);
                setFolderPath(folders);
              }
            }
          } else if (names.length > 0) {
            setSelectedBucket(names[0]);
          }
        } else if (names.length > 0) {
          setSelectedBucket(names[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nie udało się załadować katalogów');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load files when bucket or folderPath changes
  useEffect(() => {
    if (!selectedBucket) return;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const prefix = folderPath.length > 0 ? folderPath.join('/') + '/' : '';
        const { data, error: err } = await supabase.storage
          .from(selectedBucket)
          .list(prefix, { sortBy: { column: 'name', order: 'asc' } });

        if (err) throw new Error(err.message);

        if (data) {
          const folders: string[] = [];
          const fileItems: StorageFile[] = [];

          for (const item of data) {
            // Folders have null id in Supabase storage list response
            if (item.id === null) {
              folders.push(item.name);
            } else {
              fileItems.push(item as StorageFile);
            }
          }

          setSubfolders(folders);
          setFiles(fileItems);
        } else {
          setSubfolders([]);
          setFiles([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nie udało się załadować plików');
        setSubfolders([]);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedBucket, folderPath]);

  const navigateToFolder = useCallback((folderName: string) => {
    setFolderPath((prev) => [...prev, folderName]);
  }, []);

  const navigateToPathIndex = useCallback((index: number) => {
    setFolderPath((prev) => prev.slice(0, index));
  }, []);

  const handleFileClick = useCallback(
    (fileName: string) => {
      const prefix = folderPath.length > 0 ? folderPath.join('/') + '/' : '';
      const fullPath = prefix + fileName;
      const { data } = supabase.storage.from(selectedBucket).getPublicUrl(fullPath);
      const url = data.publicUrl;
      setPreviewUrl(url);
      onSelect(url);
    },
    [selectedBucket, folderPath, onSelect]
  );

  const getFileUrlForPreview = useCallback(
    (fileName: string): string => {
      const prefix = folderPath.length > 0 ? folderPath.join('/') + '/' : '';
      const fullPath = prefix + fileName;
      const { data } = supabase.storage.from(selectedBucket).getPublicUrl(fullPath);
      return data.publicUrl;
    },
    [selectedBucket, folderPath]
  );

  return (
    <div>
      {/* Bucket selector */}
      <div className="mb-3">
        <label className="block mb-1 text-xs font-semibold text-foreground-700">
          Katalog główny
        </label>
        <select
          value={selectedBucket}
          onChange={(e) => {
            setSelectedBucket(e.target.value);
            setFolderPath([]);
          }}
          className="w-full rounded-md border border-background-200 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 cursor-pointer"
        >
          {buckets.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Breadcrumb */}
      {selectedBucket && (
        <div className="mb-3 flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFolderPath([])}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              folderPath.length === 0
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
            }`}
          >
            <i className="ri-folder-line mr-1"></i>
            {selectedBucket}
          </button>
          {folderPath.map((folder, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
              <button
                type="button"
                onClick={() => navigateToPathIndex(idx + 1)}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  idx === folderPath.length - 1
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-foreground-500 hover:text-foreground-700 hover:bg-background-100'
                }`}
              >
                {folder}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
            <i className="ri-loader-4-line text-lg"></i>
          </span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 flex items-center gap-2">
          <i className="ri-error-warning-fill text-sm shrink-0"></i>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && selectedBucket && subfolders.length === 0 && files.length === 0 && (
        <div className="text-center py-8">
          <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-background-100 text-foreground-400 mb-2">
            <i className="ri-folder-open-line text-lg"></i>
          </span>
          <p className="text-xs text-foreground-500">Ten katalog jest pusty</p>
        </div>
      )}

      {/* Subfolder grid */}
      {!loading && !error && subfolders.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-foreground-500 uppercase tracking-wider mb-2">
            Katalogi
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {subfolders.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => navigateToFolder(folder)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border border-background-200/70 bg-background-50 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-background-100 text-foreground-500">
                  <i className="ri-folder-fill text-xl"></i>
                </span>
                <span className="text-[10px] font-medium text-foreground-700 text-center leading-tight break-all line-clamp-2">
                  {folder}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File grid */}
      {!loading && !error && files.length > 0 && (
        <div>
          {subfolders.length > 0 && (
            <p className="text-[10px] font-semibold text-foreground-500 uppercase tracking-wider mb-2 mt-1">
              Pliki
            </p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-1">
            {files.map((file) => {
              const isImg = isImageFile(file.name);
              const fileUrl = isImg ? getFileUrlForPreview(file.name) : '';
              const isSelected = previewUrl === fileUrl;

              return (
                <button
                  key={file.id || file.name}
                  type="button"
                  onClick={() => handleFileClick(file.name)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-400/30'
                      : 'border-background-200/70 bg-background-50 hover:border-primary-300 hover:bg-primary-50/30'
                  }`}
                >
                  {isImg ? (
                    <div className="relative h-14 w-full rounded-md overflow-hidden bg-background-200/70">
                      <img
                        src={fileUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <span className="hidden absolute inset-0 flex items-center justify-center bg-background-100 text-foreground-400">
                        <i className="ri-image-line text-sm"></i>
                      </span>
                    </div>
                  ) : (
                    <span className="flex h-14 w-full items-center justify-center rounded-md bg-background-100 text-foreground-400">
                      <i className="ri-file-line text-xl"></i>
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-foreground-700 text-center leading-tight break-all line-clamp-2">
                    {file.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected preview */}
      {previewUrl && previewUrl !== currentUrl && (
        <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50/30 p-3">
          <p className="text-[10px] font-semibold text-primary-700 mb-1.5">
            Wybrany plik:
          </p>
          <div className="h-20 rounded-md overflow-hidden bg-background-100">
            <img src={previewUrl} alt="Wybrany" className="h-full w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}