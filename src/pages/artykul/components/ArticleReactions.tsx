import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';

const QUICK_EMOJIS = [
  { emoji: '🔥', label: 'Ogień' },
  { emoji: '⚽', label: 'Piłka' },
  { emoji: '👏', label: 'Brawo' },
  { emoji: '😲', label: 'Wow' },
  { emoji: '❤️', label: 'Serce' },
  { emoji: '🏆', label: 'Trofeum' },
];

interface ReactionCount {
  emoji: string;
  count: number;
}

interface ArticleReactionsProps {
  articleSlug: string;
  userId?: string;
  onLoginRequest?: () => void;
}

export function useArticleReactions(articleSlug: string, userId?: string) {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!articleSlug) return;
    setLoading(true);
    try {
      // Get all reaction counts
      const { data: counts } = await supabase
        .from('article_reactions')
        .select('emoji')
        .eq('article_slug', articleSlug);

      if (counts) {
        const grouped: Record<string, number> = {};
        for (const r of counts) {
          grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
        }
        const list: ReactionCount[] = Object.entries(grouped)
          .map(([emoji, count]) => ({ emoji, count }))
          .sort((a, b) => b.count - a.count);
        setReactions(list);
      }

      // Get user's own reactions
      if (userId) {
        const { data: mine } = await supabase
          .from('article_reactions')
          .select('emoji')
          .eq('article_slug', articleSlug)
          .eq('user_id', userId);

        if (mine) {
          setUserReactions(new Set(mine.map((r) => r.emoji)));
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [articleSlug, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleReaction = useCallback(async (emoji: string) => {
    if (!userId || !articleSlug) return;

    const hasReacted = userReactions.has(emoji);

    // Optimistic update
    setUserReactions((prev) => {
      const next = new Set(prev);
      if (hasReacted) next.delete(emoji);
      else next.add(emoji);
      return next;
    });

    setReactions((prev) => {
      const copy = [...prev];
      const existing = copy.find((r) => r.emoji === emoji);
      if (existing) {
        if (hasReacted) {
          existing.count = Math.max(0, existing.count - 1);
        } else {
          existing.count += 1;
        }
      } else if (!hasReacted) {
        copy.push({ emoji, count: 1 });
      }
      return copy.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
    });

    // Actual DB operation
    if (hasReacted) {
      await supabase
        .from('article_reactions')
        .delete()
        .eq('article_slug', articleSlug)
        .eq('user_id', userId)
        .eq('emoji', emoji);
    } else {
      await supabase
        .from('article_reactions')
        .insert({ article_slug: articleSlug, user_id: userId, emoji });
    }
  }, [articleSlug, userId, userReactions]);

  return { reactions, userReactions, loading, toggleReaction, reload: load };
}

export default function ArticleReactions({ articleSlug, userId, onLoginRequest }: ArticleReactionsProps) {
  const { reactions, userReactions, loading, toggleReaction } = useArticleReactions(articleSlug, userId);

  const handleClick = (emoji: string) => {
    if (!userId) {
      onLoginRequest?.();
      return;
    }
    toggleReaction(emoji);
  };

  if (loading && reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {QUICK_EMOJIS.map(({ emoji, label }) => {
        const reaction = reactions.find((r) => r.emoji === emoji);
        const isActive = userReactions.has(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleClick(emoji)}
            title={label}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-sm transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'border-primary-400 bg-primary-50 text-primary-700 hover:bg-primary-100'
                : 'border-background-200 bg-background-50 text-foreground-600 hover:border-primary-300 hover:bg-primary-50/50'
            }`}
          >
            <span>{emoji}</span>
            {reaction && reaction.count > 0 && (
              <span className="text-xs font-semibold text-foreground-500">{reaction.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}