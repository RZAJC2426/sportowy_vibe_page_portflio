import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserComments, type Comment } from '@/data/comments';
import type { Profile } from '@/data/profiles';

const ROLE_OPTIONS = [
  { value: 'user', labelKey: 'admin.role_user' },
  { value: 'moderator', labelKey: 'admin.role_moderator' },
  { value: 'admin', labelKey: 'admin.role_admin' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  moderator: 'bg-accent-100 text-accent-700 border-accent-200',
  user: 'bg-background-200 text-foreground-600 border-background-300',
};

const PER_PAGE_OPTIONS = [10, 20, 50];

function logActivity(
  adminId: string,
  adminName: string,
  targetUserId: string,
  targetUserName: string,
  action: 'role_change' | 'user_delete',
  details: Record<string, string>,
) {
  return supabase.from('admin_activity_logs').insert({
    admin_id: adminId,
    admin_name: adminName,
    target_user_id: targetUserId,
    target_user_name: targetUserName,
    action,
    details,
  });
}

export default function UsersManager() {
  const { t } = useTranslation();
  const { user, profile: myProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Profile | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('user');
  const [bulkApplying, setBulkApplying] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // CSV export
  const [exporting, setExporting] = useState(false);

  // Inline name edit
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Comments preview
  const [commentsUser, setCommentsUser] = useState<Profile | null>(null);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(false);

  // Activity logs
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [logs, setLogs] = useState<Array<{
    id: string;
    admin_name: string;
    target_user_name: string;
    action: string;
    details: Record<string, string> | null;
    created_at: string;
  }>>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(false);

  // Activity log filters
  const [logActionFilter, setLogActionFilter] = useState<'all' | 'role_change' | 'user_delete'>('all');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');

  // Bulk delete
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ current: 0, total: 0 });

  const adminName = myProfile?.display_name || myProfile?.username || user?.email?.split('@')[0] || 'Admin';

  // Filtered logs
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (logActionFilter !== 'all') {
      result = result.filter((l) => l.action === logActionFilter);
    }
    if (logDateFrom) {
      const from = new Date(logDateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((l) => new Date(l.created_at) >= from);
    }
    if (logDateTo) {
      const to = new Date(logDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((l) => new Date(l.created_at) <= to);
    }
    return result;
  }, [logs, logActionFilter, logDateFrom, logDateTo]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setUsers((data as Profile[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Filter users client-side
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const dn = (u.display_name || '').toLowerCase();
      const un = (u.username || '').toLowerCase();
      return dn.includes(q) || un.includes(q);
    });
  }, [users, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageUsers = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filteredUsers.slice(start, start + perPage);
  }, [filteredUsers, safePage, perPage]);

  // Reset to page 1 when search or perPage changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, perPage]);

  // Reset selection when filtered users change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchQuery, perPage, page]);

  const allPageSelected = pageUsers.length > 0 && pageUsers.every((u) => selectedIds.has(u.id));
  const somePageSelected = pageUsers.some((u) => selectedIds.has(u.id));

  const toggleSelectAllOnPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageUsers.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageUsers.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    setFeedback(null);

    const targetUser = users.find((u) => u.id === userId);
    const oldRole = targetUser?.role || 'user';

    const { error: err } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (err) {
      setFeedback({ type: 'error', message: `Błąd: ${err.message}` });
    } else {
      setFeedback({ type: 'success', message: 'Rola użytkownika została zaktualizowana.' });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      // Log activity
      if (user) {
        logActivity(
          user.id,
          adminName,
          userId,
          targetUser?.display_name || targetUser?.username || userId.substring(0, 8),
          'role_change',
          { old_role: oldRole, new_role: newRole },
        ).then(({ error: logErr }) => {
          if (logErr) console.error('Failed to log activity:', logErr.message);
        });
      }
    }
    setChangingRole(null);
  };

  const handleBulkRoleChange = async () => {
    if (selectedIds.size === 0 || bulkApplying) return;
    setBulkApplying(true);
    setFeedback(null);

    const ids = Array.from(selectedIds);
    const selectedUsers = users.filter((u) => ids.includes(u.id));
    let successCount = 0;
    let failCount = 0;

    for (const u of selectedUsers) {
      const oldRole = u.role || 'user';
      if (oldRole === bulkRole) {
        successCount++;
        continue;
      }
      const { error: err } = await supabase
        .from('profiles')
        .update({ role: bulkRole, updated_at: new Date().toISOString() })
        .eq('id', u.id);

      if (err) {
        failCount++;
      } else {
        successCount++;
        // Log activity for each user
        if (user) {
          logActivity(
            user.id,
            adminName,
            u.id,
            u.display_name || u.username || u.id.substring(0, 8),
            'role_change',
            { old_role: oldRole, new_role: bulkRole },
          ).then(({ error: logErr }) => {
            if (logErr) console.error('Failed to log activity:', logErr.message);
          });
        }
      }
    }

    if (failCount === 0) {
      const roleLabel = t(ROLE_OPTIONS.find((o) => o.value === bulkRole)?.labelKey || 'admin.role_user');
      setFeedback({ type: 'success', message: t('admin.bulk_role_changed', { count: successCount, role: roleLabel }) });
      setUsers((prev) =>
        prev.map((u) => (ids.includes(u.id) ? { ...u, role: bulkRole } : u))
      );
      setSelectedIds(new Set());
    } else {
      setFeedback({ type: 'error', message: t('admin.bulk_role_error') });
      // Still refresh to reflect partial changes
      fetchUsers();
    }
    setBulkApplying(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    const userId = deleteConfirm.id;
    const targetName = deleteConfirm.display_name || deleteConfirm.username || userId.substring(0, 8);
    setDeletingUser(userId);
    setDeleteConfirm(null);
    setFeedback(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setFeedback({ type: 'error', message: 'Brak tokenu sesji. Odśwież stronę i spróbuj ponownie.' });
        setDeletingUser(null);
        return;
      }

      const { data } = await supabase.functions.invoke('delete-user-account', {
        body: { userId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.error) {
        setFeedback({ type: 'error', message: t('admin.delete_user_error') });
      } else {
        setFeedback({ type: 'success', message: t('admin.delete_user_success', { name: targetName }) });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        // Log activity
        if (user) {
          logActivity(
            user.id,
            adminName,
            userId,
            targetName,
            'user_delete',
            {},
          ).then(({ error: logErr }) => {
            if (logErr) console.error('Failed to log activity:', logErr.message);
          });
        }
      }
    } catch {
      setFeedback({ type: 'error', message: t('admin.delete_user_error') });
    }
    setDeletingUser(null);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || bulkDeleting) return;
    setBulkDeleteConfirmOpen(false);
    setBulkDeleting(true);

    const ids = Array.from(selectedIds);
    const selectedUsers = users.filter((u) => ids.includes(u.id));
    let successCount = 0;
    let failCount = 0;
    setBulkDeleteProgress({ current: 0, total: ids.length });

    for (let i = 0; i < selectedUsers.length; i++) {
      const u = selectedUsers[i];
      setBulkDeleteProgress({ current: i + 1, total: ids.length });

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          failCount++;
          continue;
        }

        const { data } = await supabase.functions.invoke('delete-user-account', {
          body: { userId: u.id },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.error) {
          failCount++;
        } else {
          successCount++;
          // Log activity
          if (user) {
            logActivity(
              user.id,
              adminName,
              u.id,
              u.display_name || u.username || u.id.substring(0, 8),
              'user_delete',
              {},
            ).then(({ error: logErr }) => {
              if (logErr) console.error('Failed to log activity:', logErr.message);
            });
          }
        }
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      setFeedback({ type: 'success', message: t('admin.bulk_delete_success', { count: successCount }) });
      setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
      setSelectedIds(new Set());
    } else {
      setFeedback({ type: 'error', message: t('admin.bulk_delete_error') });
      // Still refresh to reflect partial changes
      fetchUsers();
    }

    setBulkDeleting(false);
    setBulkDeleteProgress({ current: 0, total: 0 });
  };

  // CSV Export
  const exportToCSV = () => {
    setExporting(true);
    try {
      const dataToExport = searchQuery.trim() ? filteredUsers : users;
      const headers = ['Nazwa wyświetlana', 'Login', 'ID', 'Rola', 'Data dołączenia', 'Newsletter'];
      const rows = dataToExport.map((u) => [
        u.display_name || '',
        u.username || '',
        u.id,
        u.role || 'user',
        u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '',
        u.newsletter_consent ? 'Tak' : 'Nie',
      ]);

      const escapeCSV = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = t('admin.csv_filename');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // fail silently
    }
    setExporting(false);
  };

  // Activity Logs
  const fetchActivityLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(false);
    const { data, error: err } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (err) {
      setLogsError(true);
    } else {
      setLogs((data as typeof logs) || []);
    }
    setLogsLoading(false);
  }, []);

  const toggleActivityLogs = () => {
    const willShow = !showActivityLogs;
    setShowActivityLogs(willShow);
    if (willShow && logs.length === 0) {
      fetchActivityLogs();
    }
  };

  // Inline name edit handlers
  const openEditName = (u: Profile) => {
    setEditingUser(u);
    setEditName(u.display_name || u.username || '');
  };

  const handleSaveName = async () => {
    if (!editingUser || savingName) return;
    const trimmed = editName.trim();
    if (!trimmed || trimmed === (editingUser.display_name || editingUser.username || '')) {
      setEditingUser(null);
      return;
    }

    setSavingName(true);
    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', editingUser.id);

    if (err) {
      setFeedback({ type: 'error', message: t('admin.edit_name_error') });
    } else {
      const oldName = editingUser.display_name || editingUser.username || editingUser.id.substring(0, 8);
      setFeedback({ type: 'success', message: t('admin.edit_name_success', { name: oldName, newName: trimmed }) });
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, display_name: trimmed } : u))
      );
    }
    setSavingName(false);
    setEditingUser(null);
  };

  // Comments preview handlers
  const openComments = async (u: Profile) => {
    setCommentsUser(u);
    setUserComments([]);
    setCommentsLoading(true);
    setCommentsError(false);

    try {
      const comments = await fetchUserComments(u.id);
      setUserComments(comments);
    } catch {
      setCommentsError(true);
    }
    setCommentsLoading(false);
  };

  const closeComments = () => {
    setCommentsUser(null);
    setUserComments([]);
    setCommentsError(false);
  };

  const getRoleLabel = (role: string): string => {
    const opt = ROLE_OPTIONS.find((o) => o.value === role);
    return opt ? t(opt.labelKey) : role;
  };

  const getUserDisplayName = (u: Profile) => {
    return u.display_name || u.username || u.id?.substring(0, 12) || '—';
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span className="flex h-5 w-5 items-center justify-center">
            <i className={`text-sm ${feedback.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}`}></i>
          </span>
          {feedback.message}
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/5 cursor-pointer active:bg-black/10"
          >
            <i className="ri-close-line text-sm"></i>
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 rounded-lg border border-primary-200/70 bg-primary-50/50 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary-700">
              {t('admin.bulk_selected', { count: selectedIds.size })}
            </span>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-xs text-primary-600 hover:underline cursor-pointer whitespace-nowrap"
            >
              {t('admin.bulk_select_all')}
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-primary-600 hover:underline cursor-pointer whitespace-nowrap"
            >
              {t('admin.bulk_select_none')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground-600 whitespace-nowrap">
              {t('admin.bulk_role_label')}
            </span>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              className="rounded-md border border-primary-200 bg-white px-2 py-1.5 text-xs font-medium text-foreground-700 outline-none focus:border-primary-400 cursor-pointer"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkRoleChange}
              disabled={bulkApplying}
              className="rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap active:bg-primary-700 disabled:opacity-50"
            >
              {bulkApplying ? (
                <span className="flex items-center gap-1.5">
                  <span className="flex h-3 w-3 items-center justify-center animate-spin">
                    <i className="ri-loader-4-line text-[10px]"></i>
                  </span>
                  {t('admin.saving')}
                </span>
              ) : (
                t('admin.bulk_apply')
              )}
            </button>
            <button
              type="button"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              disabled={bulkDeleting}
              className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap active:bg-red-700 disabled:opacity-50"
            >
              {bulkDeleting ? (
                <span className="flex items-center gap-1.5">
                  <span className="flex h-3 w-3 items-center justify-center animate-spin">
                    <i className="ri-loader-4-line text-[10px]"></i>
                  </span>
                  {t('admin.bulk_deleting', { current: bulkDeleteProgress.current, total: bulkDeleteProgress.total })}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center">
                    <i className="ri-delete-bin-line text-[10px]"></i>
                  </span>
                  {t('admin.bulk_delete')}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header + Search + Export */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground-950">
              {t('admin.users_title')}
            </h2>
            <p className="text-sm text-foreground-500 mt-0.5">
              {t('admin.users_count', { count: filteredUsers.length })}
              {searchQuery.trim() && users.length !== filteredUsers.length && (
                <span className="text-foreground-400"> ({t('admin.users_count', { count: users.length })} łącznie)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center text-foreground-400">
                <i className="ri-search-line text-xs"></i>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.search_users')}
                className="w-full rounded-md border border-background-200/70 bg-background-50 pl-9 pr-3 py-2 text-sm text-foreground-900 placeholder-foreground-400 outline-none focus:border-primary-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-foreground-400 hover:text-foreground-600 hover:bg-background-200 cursor-pointer"
                >
                  <i className="ri-close-line text-xs"></i>
                </button>
              )}
            </div>
            {/* Export CSV */}
            <button
              type="button"
              onClick={exportToCSV}
              disabled={exporting || users.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-xs font-semibold text-foreground-600 hover:bg-background-100 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap active:bg-background-200 disabled:opacity-40 disabled:cursor-default"
            >
              {exporting ? (
                <span className="flex h-3.5 w-3.5 items-center justify-center animate-spin">
                  <i className="ri-loader-4-line text-xs"></i>
                </span>
              ) : (
                <span className="flex h-3.5 w-3.5 items-center justify-center">
                  <i className="ri-file-download-line text-xs"></i>
                </span>
              )}
              {exporting ? t('admin.exporting_csv') : t('admin.export_csv')}
            </button>
            {/* Activity Logs toggle */}
            <button
              type="button"
              onClick={toggleActivityLogs}
              className="inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-xs font-semibold text-foreground-600 hover:bg-background-100 hover:text-secondary-600 transition-colors cursor-pointer whitespace-nowrap active:bg-background-200"
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center">
                <i className="ri-history-line text-xs"></i>
              </span>
              {t('admin.tab_activity')}
              {showActivityLogs && <i className="ri-arrow-up-s-line text-xs ml-0.5"></i>}
              {!showActivityLogs && <i className="ri-arrow-down-s-line text-xs ml-0.5"></i>}
            </button>
          </div>
        </div>
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
          <button type="button" onClick={fetchUsers} className="mt-2 text-sm text-primary-600 hover:underline cursor-pointer">
            {t('admin.retry')}
          </button>
        </div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto rounded-lg border border-background-200/70">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-100 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap w-10">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                      onChange={toggleSelectAllOnPage}
                      className="h-4 w-4 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer accent-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">{t('admin.col_user')}</th>
                  <th className="px-4 py-3 whitespace-nowrap hidden md:table-cell">{t('admin.col_email')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t('admin.col_role')}</th>
                  <th className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">{t('admin.col_joined')}</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">{t('admin.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-200/50">
                {pageUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-background-50/50 transition-colors ${deletingUser === u.id ? 'opacity-40 pointer-events-none' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="h-4 w-4 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer accent-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-xs">
                            {(u.display_name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <span className="font-medium text-foreground-900 truncate block max-w-[140px]">
                            {getUserDisplayName(u)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-500 hidden md:table-cell max-w-[180px] truncate font-mono text-xs">
                      {u.id.substring(0, 12)}...
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                        <i className={`text-[8px] ${u.role === 'admin' ? 'ri-shield-star-fill' : u.role === 'moderator' ? 'ri-shield-star-line' : 'ri-user-line'}`}></i>
                        {getRoleLabel(u.role || 'user')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground-500 text-xs hidden lg:table-cell whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('pl-PL') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Edit name button */}
                        <button
                          type="button"
                          onClick={() => openEditName(u)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:bg-accent-50 hover:text-accent-500 transition-colors active:bg-accent-100"
                          title={t('admin.edit_name_title')}
                        >
                          <i className="ri-edit-line text-sm"></i>
                        </button>
                        {/* View comments button */}
                        <button
                          type="button"
                          onClick={() => openComments(u)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:bg-secondary-50 hover:text-secondary-500 transition-colors active:bg-secondary-100"
                          title={t('admin.view_comments')}
                        >
                          <i className="ri-chat-3-line text-sm"></i>
                        </button>
                        {/* Role select */}
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={changingRole === u.id}
                          className="rounded-md border border-background-200/70 bg-background-50 px-2 py-1.5 text-xs font-medium text-foreground-700 outline-none focus:border-primary-400 cursor-pointer disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                          ))}
                        </select>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(u)}
                          disabled={deletingUser === u.id}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:bg-red-50 hover:text-red-500 transition-colors active:bg-red-100 disabled:opacity-30"
                          title={t('admin.delete_user')}
                        >
                          {deletingUser === u.id ? (
                            <span className="flex h-4 w-4 items-center justify-center animate-spin">
                              <i className="ri-loader-4-line text-sm"></i>
                            </span>
                          ) : (
                            <i className="ri-delete-bin-line text-sm"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-foreground-400">
                      {searchQuery.trim() ? 'Brak wyników dla podanej frazy.' : t('admin.no_users')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {filteredUsers.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-500">{t('admin.per_page')}</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="rounded-md border border-background-200/70 bg-background-50 px-2 py-1.5 text-xs font-medium text-foreground-700 outline-none focus:border-primary-400 cursor-pointer"
                >
                  {PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Page nav */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-500">
                  {t('admin.page_info', { current: safePage, total: totalPages })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default text-xs"
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (safePage <= 3) {
                      pageNum = i + 1;
                    } else if (safePage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = safePage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          pageNum === safePage
                            ? 'bg-primary-500 text-white'
                            : 'border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default text-xs"
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Activity Logs Section */}
      {showActivityLogs && (
        <div className="mt-8">
          <div className="rounded-lg border border-background-200/70 bg-background-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-background-200/70 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
                  <i className="ri-history-line text-xs"></i>
                </span>
                <h3 className="font-heading text-base font-bold text-foreground-950">
                  {t('admin.activity_title')}
                </h3>
                {!logsLoading && !logsError && (
                  <span className="text-xs text-foreground-500">
                    {filteredLogs.length !== logs.length
                      ? t('admin.activity_filtered_count', { count: filteredLogs.length, total: logs.length })
                      : t('admin.activity_count', { count: logs.length })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Action type filter */}
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value as 'all' | 'role_change' | 'user_delete')}
                  className="rounded-md border border-background-200/70 bg-background-50 px-2 py-1.5 text-[11px] font-medium text-foreground-700 outline-none focus:border-primary-400 cursor-pointer"
                >
                  <option value="all">{t('admin.activity_filter_all')}</option>
                  <option value="role_change">{t('admin.activity_filter_role_change')}</option>
                  <option value="user_delete">{t('admin.activity_filter_user_delete')}</option>
                </select>
                {/* Date from */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-foreground-400 whitespace-nowrap">{t('admin.activity_filter_date_from')}</span>
                  <input
                    type="date"
                    value={logDateFrom}
                    onChange={(e) => setLogDateFrom(e.target.value)}
                    className="rounded-md border border-background-200/70 bg-background-50 px-2 py-1.5 text-[11px] font-medium text-foreground-700 outline-none focus:border-primary-400 cursor-pointer"
                  />
                </div>
                {/* Date to */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-foreground-400 whitespace-nowrap">{t('admin.activity_filter_date_to')}</span>
                  <input
                    type="date"
                    value={logDateTo}
                    onChange={(e) => setLogDateTo(e.target.value)}
                    className="rounded-md border border-background-200/70 bg-background-50 px-2 py-1.5 text-[11px] font-medium text-foreground-700 outline-none focus:border-primary-400 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchActivityLogs}
                  className="inline-flex items-center gap-1 rounded-md border border-background-200/70 bg-background-50 px-2.5 py-1.5 text-[11px] font-semibold text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="flex h-3 w-3 items-center justify-center">
                    <i className="ri-refresh-line text-[10px]"></i>
                  </span>
                  {t('admin.retry')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowActivityLogs(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-400 hover:bg-background-100 hover:text-foreground-600 transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {logsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-primary-500 animate-spin">
                    <i className="ri-loader-4-line text-base"></i>
                  </span>
                  <span className="text-sm text-foreground-500">{t('admin.activity_loading')}</span>
                </div>
              ) : logsError ? (
                <div className="text-center py-10">
                  <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-red-50 text-red-400">
                    <i className="ri-error-warning-line text-lg"></i>
                  </span>
                  <p className="mt-2 text-sm text-red-600">{t('admin.activity_error')}</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-10">
                  <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-background-100 text-foreground-300">
                    <i className="ri-file-list-3-line text-lg"></i>
                  </span>
                  <p className="mt-2 text-sm text-foreground-500">{t('admin.activity_empty')}</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-background-100 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">{t('admin.activity_col_admin')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('admin.activity_col_target')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('admin.activity_col_action')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('admin.activity_col_details')}</th>
                      <th className="px-4 py-3 whitespace-nowrap">{t('admin.activity_col_date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-background-200/50">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-background-50/50 transition-colors">
                        <td className="px-4 py-3 text-foreground-900 font-medium text-xs whitespace-nowrap">
                          {log.admin_name}
                        </td>
                        <td className="px-4 py-3 text-foreground-700 text-xs whitespace-nowrap">
                          {log.target_user_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            log.action === 'role_change'
                              ? 'bg-secondary-100 text-secondary-700 border-secondary-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }`}>
                            <i className={`text-[8px] ${log.action === 'role_change' ? 'ri-exchange-line' : 'ri-delete-bin-line'}`}></i>
                            {log.action === 'role_change' ? t('admin.activity_role_changed') : t('admin.activity_user_deleted')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground-500 text-xs">
                          {log.action === 'role_change' && log.details ? (
                            <span>
                              {getRoleLabel(log.details.old_role || 'user')} <span className="text-foreground-400">{t('admin.activity_from')}</span> {getRoleLabel(log.details.new_role || 'user')}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground-500 text-xs whitespace-nowrap">
                          {formatTime(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-background-200/70 bg-background-50 p-6 shadow-lg shadow-black/5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 flex-shrink-0">
                <i className="ri-alert-line text-lg"></i>
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg font-bold text-foreground-950">
                  {t('admin.delete_user_confirm_title')}
                </h3>
                <p className="mt-2 text-sm text-foreground-600">
                  {t('admin.delete_user_confirm', { name: getUserDisplayName(deleteConfirm) })}
                </p>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="rounded-md border border-background-200/70 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap active:bg-background-200"
                  >
                    {t('admin.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap active:bg-red-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center">
                        <i className="ri-delete-bin-line text-xs"></i>
                      </span>
                      {t('admin.delete')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setBulkDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-background-200/70 bg-background-50 p-6 shadow-lg shadow-black/5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 flex-shrink-0">
                <i className="ri-alert-line text-lg"></i>
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg font-bold text-foreground-950">
                  {t('admin.bulk_delete_confirm_title')}
                </h3>
                <p className="mt-2 text-sm text-foreground-600">
                  {t('admin.bulk_delete_confirm', { count: selectedIds.size })}
                </p>
                <div className="mt-1 text-xs text-foreground-400 max-h-24 overflow-y-auto">
                  {Array.from(selectedIds).slice(0, 10).map((id) => {
                    const u = users.find((x) => x.id === id);
                    return u ? (
                      <span key={id} className="inline-block mr-2 mb-1 bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-[10px]">
                        {getUserDisplayName(u)}
                      </span>
                    ) : null;
                  })}
                  {selectedIds.size > 10 && (
                    <span className="text-foreground-400">+{selectedIds.size - 10} więcej</span>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkDeleteConfirmOpen(false)}
                    className="rounded-md border border-background-200/70 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap active:bg-background-200"
                  >
                    {t('admin.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap active:bg-red-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center">
                        <i className="ri-delete-bin-line text-xs"></i>
                      </span>
                      {t('admin.delete')} ({selectedIds.size})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-background-200/70 bg-background-50 p-6 shadow-lg shadow-black/5">
            <h3 className="font-heading text-lg font-bold text-foreground-950">
              {t('admin.edit_name_title')}
            </h3>
            <p className="mt-1 text-sm text-foreground-500">
              {getUserDisplayName(editingUser)}
            </p>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-foreground-600 mb-1.5">
                {t('admin.edit_name_label')}
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('admin.edit_name_placeholder')}
                maxLength={50}
                className="w-full rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-sm text-foreground-900 placeholder-foreground-400 outline-none focus:border-primary-400 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setEditingUser(null);
                }}
                autoFocus
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-md border border-background-200/70 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap active:bg-background-200"
              >
                {t('admin.edit_name_cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveName}
                disabled={!editName.trim() || savingName}
                className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap active:bg-primary-700 disabled:opacity-50"
              >
                {savingName ? (
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center animate-spin">
                      <i className="ri-loader-4-line text-xs"></i>
                    </span>
                    {t('admin.edit_name_saving')}
                  </span>
                ) : (
                  t('admin.edit_name_save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Preview Modal */}
      {commentsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeComments}
          />
          <div className="relative w-full max-w-xl max-h-[80vh] rounded-xl border border-background-200/70 bg-background-50 shadow-lg shadow-black/5 flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-background-200/70 flex-shrink-0">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground-950">
                  {t('admin.comments_title', { name: getUserDisplayName(commentsUser) })}
                </h3>
                {!commentsLoading && !commentsError && (
                  <p className="text-xs text-foreground-500 mt-0.5">
                    {t('admin.comments_count', { count: userComments.length })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeComments}
                className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-400 hover:bg-background-100 hover:text-foreground-600 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-primary-500 animate-spin">
                    <i className="ri-loader-4-line text-xl"></i>
                  </span>
                  <span className="ml-2 text-sm text-foreground-500">{t('admin.comments_loading')}</span>
                </div>
              ) : commentsError ? (
                <div className="text-center py-10">
                  <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-red-50 text-red-400">
                    <i className="ri-error-warning-line text-lg"></i>
                  </span>
                  <p className="mt-2 text-sm text-red-600">{t('admin.comments_error')}</p>
                </div>
              ) : userComments.length === 0 ? (
                <div className="text-center py-10">
                  <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-background-100 text-foreground-300">
                    <i className="ri-chat-off-line text-lg"></i>
                  </span>
                  <p className="mt-2 text-sm text-foreground-500">{t('admin.comments_none')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userComments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-background-200/70 bg-background-100/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-secondary-700 bg-secondary-100 rounded-md px-2 py-0.5">
                          {t('admin.comments_article')}: {comment.article_slug}
                        </span>
                        <span className="text-xs text-foreground-400">
                          {formatTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-700 whitespace-pre-line break-words">
                        {comment.content.length > 200
                          ? comment.content.substring(0, 200) + '...'
                          : comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-background-200/70 flex-shrink-0 flex justify-end">
              <button
                type="button"
                onClick={closeComments}
                className="rounded-md border border-background-200/70 bg-background-50 px-4 py-2 text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t('admin.comments_close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Legend */}
      <div className="mt-6 p-4 rounded-lg border border-background-200/70 bg-background-50">
        <h4 className="text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-3">{t('admin.role_legend')}</h4>
        <div className="flex flex-wrap gap-4">
          {ROLE_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[opt.value]}`}>
                {t(opt.labelKey)}
              </span>
              <span className="text-xs text-foreground-500">
                {opt.value === 'admin' ? t('admin.role_admin_desc') : opt.value === 'moderator' ? t('admin.role_moderator_desc') : t('admin.role_user_desc')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}