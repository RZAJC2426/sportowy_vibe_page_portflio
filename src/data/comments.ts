import { supabase } from '@/lib/supabase';

export interface Comment {
  id: number;
  article_slug: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
  parent_id: number | null;
}

export async function fetchComments(articleSlug: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_slug', articleSlug)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch comments:', error);
    return [];
  }

  return data as Comment[];
}

export async function addComment(
  articleSlug: string,
  userId: string,
  userName: string,
  userAvatar: string | null,
  content: string,
  parentId?: number | null,
): Promise<Comment | null> {
  const insertData: Record<string, unknown> = {
    article_slug: articleSlug,
    user_id: userId,
    user_name: userName,
    user_avatar: userAvatar,
    content,
  };
  if (parentId) insertData.parent_id = parentId;

  const { data, error } = await supabase
    .from('comments')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to add comment:', error);
    return null;
  }

  return data as Comment;
}

export async function deleteComment(commentId: number): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Failed to delete comment:', error);
    return false;
  }

  return true;
}

export async function fetchUserComments(userId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch user comments:', error);
    return [];
  }

  return data as Comment[];
}