import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';

export function useArticleLike(articleSlug: string, userId: string | undefined) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!articleSlug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      // Get like count
      const { count } = await supabase
        .from('article_likes')
        .select('*', { count: 'exact', head: true })
        .eq('article_slug', articleSlug);

      if (!cancelled) {
        setLikeCount(count || 0);
      }

      // Check if current user liked
      if (userId) {
        const { data } = await supabase
          .from('article_likes')
          .select('id')
          .eq('article_slug', articleSlug)
          .eq('user_id', userId)
          .maybeSingle();

        if (!cancelled) {
          setLiked(!!data);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [articleSlug, userId]);

  const toggleLike = useCallback(async () => {
    if (!userId || !articleSlug) return;

    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase
        .from('article_likes')
        .delete()
        .eq('article_slug', articleSlug)
        .eq('user_id', userId);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase
        .from('article_likes')
        .insert({ article_slug: articleSlug, user_id: userId });
    }
  }, [articleSlug, userId, liked]);

  return { liked, likeCount, loading, toggleLike };
}

export function useCommentLike(commentId: number, userId: string | undefined) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!commentId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      if (!cancelled) {
        setLikeCount(count || 0);
      }

      if (userId) {
        const { data } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', commentId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!cancelled) {
          setLiked(!!data);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [commentId, userId]);

  const toggleLike = useCallback(async () => {
    if (!userId || !commentId) return;

    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId });
    }
  }, [commentId, userId, liked]);

  return { liked, likeCount, loading, toggleLike };
}

export function usePageVisit(pagePath: string) {
  useEffect(() => {
    if (!pagePath) return;

    // Delay page visit tracking to avoid blocking initial render
    const timer = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from('page_visits')
          .select('visit_count')
          .eq('page_path', pagePath)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('page_visits')
            .update({ visit_count: existing.visit_count + 1, last_visited: new Date().toISOString() })
            .eq('page_path', pagePath);
        } else {
          await supabase
            .from('page_visits')
            .insert({ page_path: pagePath, visit_count: 1, last_visited: new Date().toISOString() });
        }
      } catch {
        // track silently
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [pagePath]);
}