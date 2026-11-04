import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { fetchUserComments, type Comment } from '@/data/comments';

export default function UserCommentsList() {
  const { t } = useTranslation('common');
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      const data = await fetchUserComments(user.id);
      setComments(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-primary-500 animate-spin">
          <i className="ri-loader-4-line text-xl"></i>
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
        <p className="text-sm font-medium text-red-600 mb-3">{t('fan_zone.comments_error')}</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <i className="ri-refresh-line"></i> {t('fan_zone.comments_retry')}
        </button>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-background-200/80 bg-background-50 p-10 text-center">
        <span className="flex h-14 w-14 mx-auto mb-4 items-center justify-center rounded-full bg-background-100 text-foreground-300">
          <i className="ri-chat-off-line text-2xl"></i>
        </span>
        <h3 className="font-heading text-base font-semibold text-foreground-700">{t('fan_zone.comments_empty')}</h3>
        <p className="mt-2 text-sm text-foreground-500 max-w-xs mx-auto">
          {t('fan_zone.comments_empty_desc')}{' '}
          <Link to="/aktualnosci" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer">
            {t('nav.news')}
          </Link>
          {' '}{t('fan_zone.comments_empty_cta')}
        </p>
      </div>
    );
  }

  const displayName = profile?.display_name
    ?? profile?.username
    ?? user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? 'Kibicu';

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg border border-background-200/70 bg-background-50 p-4 transition-colors hover:border-background-300">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-700">
              {initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground-700">
                  {comment.user_name}
                </span>
                <span className="text-[11px] text-foreground-400">
                  {formatTime(comment.created_at)}
                </span>
              </div>
              <Link
                to={`/artykul/${comment.article_slug}`}
                className="mt-1 block text-sm text-foreground-600 hover:text-primary-600 transition-colors line-clamp-2 cursor-pointer active:text-primary-700"
              >
                {comment.content}
              </Link>
            </div>
            <Link
              to={`/artykul/${comment.article_slug}`}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-foreground-300 hover:text-primary-500 hover:bg-primary-50 active:bg-primary-100/50 transition-all cursor-pointer"
              title={t('fan_zone.article_tooltip')}
            >
              <i className="ri-arrow-right-line text-sm"></i>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}