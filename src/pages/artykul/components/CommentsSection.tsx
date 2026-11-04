import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { fetchComments, addComment, deleteComment, type Comment } from '@/data/comments';
import { useCommentLike } from '@/hooks/useLikes';
import { supabase } from '@/lib/supabase';
import EmojiPicker from '@/components/base/EmojiPicker';
import ReportModal from './ReportModal';

interface CommentsSectionProps {
  articleSlug: string;
  articleTitle: string;
  onLoginRequest?: () => void;
}

function getCommentCountLabel(count: number, t: (key: string) => string): string {
  if (count === 1) return t('comments.count_one');
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 10 || lastTwo > 20)) return t('comments.count_few');
  return t('comments.count_many');
}

function getRoleLabel(role: string | null): { label: string; className: string } {
  if (role === 'admin') return { label: 'Administrator', className: 'bg-red-100 text-red-700 border-red-200' };
  if (role === 'moderator') return { label: 'Moderator', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Użytkownik', className: 'bg-background-100 text-foreground-500 border-background-200' };
}

function CommentItem({
  comment,
  userId,
  onDelete,
  onReply,
  onReport,
  formatTime,
  t,
  onLoginRequest,
  userRole,
  isReply,
  childComments,
  allProfiles,
  onDeleteChild,
  onReplyChild,
  onReportChild,
}: {
  comment: Comment;
  userId?: string;
  onDelete: (id: number) => void;
  onReply: (id: number, userName: string) => void;
  onReport: (id: number, label: string) => void;
  formatTime: (d: string) => string;
  t: (key: string) => string;
  onLoginRequest?: () => void;
  userRole: string | null;
  isReply?: boolean;
  childComments?: Comment[];
  allProfiles?: Record<string, { role: string | null; avatar: string }>;
  onDeleteChild?: (id: number) => void;
  onReplyChild?: (id: number, userName: string) => void;
  onReportChild?: (id: number, label: string) => void;
}) {
  const { liked, likeCount, toggleLike } = useCommentLike(comment.id, userId);

  const handleLikeClick = () => {
    if (!userId) {
      onLoginRequest?.();
      return;
    }
    toggleLike();
  };

  const handleReplyClick = () => {
    if (!userId) {
      onLoginRequest?.();
      return;
    }
    onReply(comment.id, comment.user_name);
  };

  const roleInfo = getRoleLabel(userRole);
  const avatarSrc = comment.user_avatar;

  return (
    <div className={`${isReply ? 'ml-8 md:ml-12 mt-3' : ''}`}>
      <div className="flex items-start gap-3 group">
        {/* Avatar */}
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={comment.user_name}
            className="h-8 w-8 flex-shrink-0 rounded-full object-cover border border-background-200"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.querySelector('.avatar-fallback')?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700 ${avatarSrc ? 'hidden' : ''} avatar-fallback`}>
          {comment.user_name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-yellow-600">
              {comment.user_name}
            </span>
            <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${roleInfo.className}`}>
              {roleInfo.label}
            </span>
            <span className="text-xs text-yellow-500">
              {formatTime(comment.created_at)}
            </span>
          </div>
          {/* Reply indicator */}
          {comment.parent_id && (
            <p className="text-xs text-yellow-400 mt-0.5">
              <i className="ri-reply-line text-[10px] mr-1"></i>
              Odpowiedź
            </p>
          )}
          <p className="mt-1 text-sm text-foreground-700 whitespace-pre-line break-words">
            {comment.content}
          </p>
          {/* Actions */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                liked
                  ? 'bg-red-50 text-red-500 border border-red-200'
                  : 'text-foreground-400 hover:text-red-500 hover:bg-red-50 border border-transparent'
              }`}
              title={liked ? 'Cofnij polubienie' : 'Polub komentarz'}
            >
              <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} text-xs`}></i>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <button
              type="button"
              onClick={handleReplyClick}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-reply-line text-xs"></i>
              Odpowiedz
            </button>
            <button
              type="button"
              onClick={() => onReport(comment.id, comment.content.substring(0, 80))}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-foreground-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-flag-line text-[10px]"></i>
              Zgłoś
            </button>
          </div>
        </div>
        {userId === comment.user_id && (
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-foreground-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
            title={t('comments.delete_title')}
          >
            <i className="ri-delete-bin-6-line text-sm"></i>
          </button>
        )}
      </div>

      {/* Child comments (replies) */}
      {childComments && childComments.length > 0 && (
        <div className="mt-1">
          {childComments.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              userId={userId}
              onDelete={onDeleteChild || onDelete}
              onReply={onReplyChild || onReply}
              onReport={onReportChild || onReport}
              formatTime={formatTime}
              t={t}
              onLoginRequest={onLoginRequest}
              userRole={allProfiles?.[child.user_id]?.role || null}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentsSection({ articleSlug, articleTitle, onLoginRequest }: CommentsSectionProps) {
  const { t } = useTranslation('common');
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [userRoles, setUserRoles] = useState<Record<string, string | null>>({});
  const [profileAvatars, setProfileAvatars] = useState<Record<string, string>>({});
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyToName, setReplyToName] = useState('');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'comment'>('comment');
  const [reportTarget, setReportTarget] = useState('');
  const [reportLabel, setReportLabel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await fetchComments(articleSlug);
      setComments(data);

      const uniqueIds = [...new Set(data.map((c) => c.user_id).filter(Boolean))];
      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, role, avatar_url')
          .in('id', uniqueIds);

        if (profiles) {
          const roles: Record<string, string | null> = {};
          const avatars: Record<string, string> = {};
          for (const p of profiles) {
            roles[p.id] = (p as any).role || null;
            if ((p as any).avatar_url) avatars[p.id] = (p as any).avatar_url;
          }
          setUserRoles(roles);
          setProfileAvatars(avatars);

          if (Object.keys(avatars).length > 0) {
            setComments((prev) =>
              prev.map((c) => {
                const profileAvatar = avatars[c.user_id];
                if (profileAvatar && c.user_avatar !== profileAvatar) {
                  return { ...c, user_avatar: profileAvatar };
                }
                return c;
              })
            );
          }
        }
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [articleSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (replyToId !== null && replyInputRef.current) {
      replyInputRef.current.focus();
      replyInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [replyToId]);

  const displayName = profile?.display_name
    ?? profile?.username
    ?? user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? 'Kibicu';

  const avatarUrl = profile?.avatar_url
    ?? user?.user_metadata?.avatar_url
    ?? user?.user_metadata?.picture
    ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;

    setSubmitting(true);
    const comment = await addComment(articleSlug, user.id, displayName, avatarUrl, newComment.trim(), replyToId);
    if (comment) {
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      setReplyToId(null);
      setReplyToName('');
      if (!userRoles[user.id]) {
        setUserRoles((prev) => ({ ...prev, [user.id]: profile?.role || null }));
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: number) => {
    const ok = await deleteComment(commentId);
    if (ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleReply = (commentId: number, userName: string) => {
    setReplyToId(commentId);
    setReplyToName(userName);
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyToName('');
  };

  const handleOpenReport = (commentId: number, label: string) => {
    setReportType('comment');
    setReportTarget(String(commentId));
    setReportLabel(label);
    setReportModalOpen(true);
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

  // Separate top-level and reply comments
  const topLevelComments = comments.filter((c) => !c.parent_id);
  const replyComments = comments.filter((c) => c.parent_id);

  return (
    <section className="py-10 md:py-16 bg-background-50" id="komentarze">
      <div className="mx-auto max-w-[800px] px-4 md:px-6">
        <div className="flex items-center gap-3 mb-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
            <i className="ri-chat-3-line text-lg"></i>
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground-950">
              {t('comments.title')}
            </h2>
            <p className="text-xs text-foreground-500">
              {comments.length} {getCommentCountLabel(comments.length, t)}
            </p>
          </div>
        </div>

        {/* Comment form */}
        {user ? (
          <form onSubmit={handleSubmit} className="mb-10">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                {replyToId !== null && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-foreground-500 flex items-center gap-1">
                      <i className="ri-reply-line text-xs"></i>
                      Odpowiadasz: <strong className="text-foreground-700">{replyToName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={cancelReply}
                      className="text-xs text-foreground-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <i className="ri-close-line"></i> Anuluj
                    </button>
                  </div>
                )}
                <textarea
                  ref={replyInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyToId ? 'Napisz odpowiedź...' : t('comments.placeholder')}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-background-200 bg-background-50 px-3.5 py-2.5 text-sm text-foreground-900 placeholder-foreground-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 resize-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <EmojiPicker onSelect={(emoji) => setNewComment((prev) => prev + emoji)} />
                    <span className="text-xs text-foreground-400">
                      {newComment.length}/500
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {submitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-xs"></i>
                        {t('comments.sending')}
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line text-xs"></i>
                        {t('comments.publish')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-10 rounded-xl border border-background-200/80 bg-background-100 p-5 text-center">
            <p className="text-sm text-foreground-600">
              <button
                type="button"
                onClick={onLoginRequest}
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
              >
                {t('comments.login_cta')}
              </button>
              {' '}{t('comments.login_desc')}
            </p>
          </div>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-primary-500 animate-spin">
              <i className="ri-loader-4-line text-xl"></i>
            </span>
          </div>
        ) : fetchError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-medium text-red-600 mb-3">
              {t('comments.load_error')}
            </p>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line"></i>
              {t('comments.retry')}
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-background-200/80 bg-background-50 p-10 text-center">
            <span className="flex h-12 w-12 mx-auto mb-3 items-center justify-center rounded-full bg-background-100 text-foreground-300">
              <i className="ri-chat-off-line text-xl"></i>
            </span>
            <p className="text-sm font-medium text-foreground-500">{t('comments.empty')}</p>
            <p className="mt-1 text-xs text-foreground-400">{t('comments.empty_desc')}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {topLevelComments.map((comment) => {
              const children = replyComments.filter((r) => r.parent_id === comment.id);
              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  userId={user?.id}
                  onDelete={handleDelete}
                  onReply={handleReply}
                  onReport={handleOpenReport}
                  formatTime={formatTime}
                  t={t}
                  onLoginRequest={onLoginRequest}
                  userRole={userRoles[comment.user_id] || null}
                  childComments={children.length > 0 ? children : undefined}
                  allProfiles={userRoles && profileAvatars ? Object.fromEntries(
                    Object.keys(userRoles).map((id) => [id, { role: userRoles[id], avatar: profileAvatars[id] || '' }])
                  ) : undefined}
                  onDeleteChild={handleDelete}
                  onReplyChild={handleReply}
                  onReportChild={handleOpenReport}
                />
              );
            })}
          </div>
        )}
      </div>

      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType={reportType}
        reportTarget={reportTarget}
        reportLabel={reportLabel}
      />
    </section>
  );
}