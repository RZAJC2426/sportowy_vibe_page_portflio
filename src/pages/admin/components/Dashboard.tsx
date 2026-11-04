import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

interface MonthlyData {
  month: string;
  count: number;
}

interface RoleData {
  name: string;
  value: number;
  color: string;
}

interface TopPage {
  path: string;
  visits: number;
}

interface TopArticle {
  slug: string;
  likes: number;
}

const ROLE_CHART_COLORS: Record<string, string> = {
  admin: '#ef4444',
  moderator: '#f59e0b',
  user: '#6b7280',
};

const CHART_ACCENT = '#f59e0b';
const CHART_PRIMARY = '#ef4444';
const CHART_GRID = 'var(--foreground-200)';

function getMonthLabel(date: Date): string {
  const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
  return `${months[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
}

function groupByMonth<T extends { created_at: string }>(items: T[]): MonthlyData[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const d = new Date(item.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [y, m] = key.split('-');
      const label = `${['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'][Number(m)-1]} ${y.slice(2)}`;
      return { month: label, count };
    });
}

interface DashboardData {
  usersByMonth: MonthlyData[];
  commentsByMonth: MonthlyData[];
  roleDistribution: RoleData[];
  totalUsers: number;
  totalComments: number;
  newThisMonth: number;
  totalArticleLikes: number;
  totalCommentLikes: number;
  totalPageVisits: number;
  topPages: TopPage[];
  topArticles: TopArticle[];
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        profilesRes, commentsRes, articleLikesRes,
        commentLikesRes, pageVisitsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('role,created_at').order('created_at', { ascending: true }),
        supabase.from('comments').select('created_at').order('created_at', { ascending: true }),
        supabase.from('article_likes').select('article_slug'),
        supabase.from('comment_likes').select('comment_id'),
        supabase.from('page_visits').select('page_path,visit_count').order('visit_count', { ascending: false }),
      ]);

      if (profilesRes.error) throw new Error(profilesRes.error.message);
      if (commentsRes.error) throw new Error(commentsRes.error.message);

      const profiles = (profilesRes.data || []) as Array<{ role: string; created_at: string }>;
      const comments = (commentsRes.data || []) as Array<{ created_at: string }>;
      const articleLikesData = (articleLikesRes.data || []) as Array<{ article_slug: string }>;
      const commentLikesData = (commentLikesRes.data || []) as Array<{ comment_id: string }>;
      const pageVisitsData = (pageVisitsRes.data || []) as Array<{ page_path: string; visit_count: number }>;

      const usersByMonth = groupByMonth(profiles);
      const commentsByMonth = groupByMonth(comments);

      const now = new Date();
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const roleCounts = new Map<string, number>();
      let newThisMonth = 0;
      profiles.forEach((p) => {
        const role = p.role || 'user';
        roleCounts.set(role, (roleCounts.get(role) || 0) + 1);

        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key === thisMonthKey) newThisMonth++;
      });

      const ROLE_LABELS: Record<string, string> = {
        admin: t('admin.role_admin'),
        moderator: t('admin.role_moderator'),
        user: t('admin.role_user'),
      };

      const roleDistribution: RoleData[] = Array.from(roleCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([role, value]) => ({
          name: ROLE_LABELS[role] || role,
          value,
          color: ROLE_CHART_COLORS[role] || '#9ca3af',
        }));

      // Top pages by visits (top 5)
      const topPages: TopPage[] = pageVisitsData.slice(0, 5).map((p) => ({
        path: p.page_path,
        visits: p.visit_count,
      }));

      // Top articles by likes (top 5)
      const likeMap = new Map<string, number>();
      articleLikesData.forEach((l) => {
        likeMap.set(l.article_slug, (likeMap.get(l.article_slug) || 0) + 1);
      });
      const topArticles: TopArticle[] = Array.from(likeMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([slug, likes]) => ({ slug, likes }));

      const totalPageVisits = pageVisitsData.reduce((sum, p) => sum + p.visit_count, 0);

      setData({
        usersByMonth,
        commentsByMonth,
        roleDistribution,
        totalUsers: profiles.length,
        totalComments: comments.length,
        newThisMonth,
        totalArticleLikes: articleLikesData.length,
        totalCommentLikes: commentLikesData.length,
        totalPageVisits,
        topPages,
        topArticles,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-background-200/70 bg-background-50 px-3 py-2 shadow-sm text-xs">
        <p className="font-semibold text-foreground-900">{label}</p>
        <p className="text-foreground-600">{payload[0].value}</p>
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: RoleData }> }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-background-200/70 bg-background-50 px-3 py-2 shadow-sm text-xs">
        <p className="font-semibold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
        <p className="text-foreground-600">{payload[0].value} {t('admin.users_count', { count: payload[0].value }).split(' ').pop()}</p>
      </div>
    );
  };

  return (
    <div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-primary-500 animate-spin">
            <i className="ri-loader-4-line text-2xl"></i>
          </span>
          <p className="text-sm text-foreground-500">{t('admin.dashboard_loading')}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-400">
            <i className="ri-error-warning-line text-2xl"></i>
          </span>
          <p className="text-sm text-red-600">{t('admin.dashboard_error')}</p>
          <p className="text-xs text-foreground-400 font-mono">{error}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-xs font-semibold text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="flex h-3.5 w-3.5 items-center justify-center">
              <i className="ri-refresh-line text-xs"></i>
            </span>
            {t('admin.dashboard_retry')}
          </button>
        </div>
      ) : data && (data.totalUsers === 0) ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-100 text-foreground-300">
            <i className="ri-bar-chart-line text-2xl"></i>
          </span>
          <p className="mt-3 text-sm text-foreground-500">{t('admin.dashboard_no_data')}</p>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards — first row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <i className="ri-group-line text-lg"></i>
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground-950">{data.totalUsers}</p>
                  <p className="text-xs text-foreground-500">{t('admin.dashboard_total_users')}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
                  <i className="ri-chat-3-line text-lg"></i>
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground-950">{data.totalComments}</p>
                  <p className="text-xs text-foreground-500">{t('admin.dashboard_total_comments')}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                  <i className="ri-user-add-line text-lg"></i>
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground-950">{data.newThisMonth}</p>
                  <p className="text-xs text-foreground-500">{t('admin.dashboard_new_this_month')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards — second row (likes + visits) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <i className="ri-heart-fill text-lg"></i>
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground-950">{data.totalArticleLikes}</p>
                  <p className="text-xs text-foreground-500">Polubienia artykułów</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                  <i className="ri-heart-3-line text-lg"></i>
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground-950">{data.totalCommentLikes}</p>
                  <p className="text-xs text-foreground-500">Polubienia komentarzy</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <i className="ri-eye-line text-lg"></i>
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground-950">{data.totalPageVisits}</p>
                  <p className="text-xs text-foreground-500">Odwiedziny stron</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users over time - Line Chart */}
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <h3 className="font-heading text-sm font-bold text-foreground-950 mb-1">
                {t('admin.dashboard_users_over_time')}
              </h3>
              <p className="text-xs text-foreground-500 mb-4">
                {t('admin.dashboard_users_over_time_desc')}
              </p>
              {data.usersByMonth.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-xs text-foreground-400">
                  {t('admin.dashboard_no_data')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.usersByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground-200)" opacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--foreground-500)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--foreground-500)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke={CHART_ACCENT} strokeWidth={2.5} dot={{ r: 3, fill: CHART_ACCENT }} activeDot={{ r: 5, fill: CHART_ACCENT }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Role distribution - Pie Chart */}
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <h3 className="font-heading text-sm font-bold text-foreground-950 mb-1">
                {t('admin.dashboard_role_distribution')}
              </h3>
              <p className="text-xs text-foreground-500 mb-4">
                {t('admin.dashboard_role_distribution_desc')}
              </p>
              {data.roleDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-xs text-foreground-400">
                  {t('admin.dashboard_no_data')}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={data.roleDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {data.roleDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2">
                    {data.roleDistribution.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-xs text-foreground-700">{entry.name}</span>
                        <span className="text-xs font-semibold text-foreground-950 ml-auto">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comment activity - Bar Chart */}
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <h3 className="font-heading text-sm font-bold text-foreground-950 mb-1">
                {t('admin.dashboard_comment_activity')}
              </h3>
              <p className="text-xs text-foreground-500 mb-4">
                {t('admin.dashboard_comment_activity_desc')}
              </p>
              {data.commentsByMonth.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-xs text-foreground-400">
                  {t('admin.dashboard_no_data')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.commentsByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground-200)" opacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--foreground-500)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--foreground-500)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Pages */}
            <div className="rounded-xl border border-background-200/70 bg-background-50 p-5">
              <h3 className="font-heading text-sm font-bold text-foreground-950 mb-1">
                Top 5 — Najczęściej odwiedzane strony
              </h3>
              <p className="text-xs text-foreground-500 mb-4">
                Strony z największą liczbą odsłon
              </p>
              {data.topPages.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-xs text-foreground-400">
                  Brak danych o odwiedzinach
                </div>
              ) : (
                <div className="space-y-2">
                  {data.topPages.map((page, idx) => (
                    <div key={page.path} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm text-foreground-700 truncate">{page.path}</span>
                      <span className="text-sm font-bold text-foreground-950 whitespace-nowrap">{page.visits}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Articles by Likes */}
          {data.topArticles.length > 0 && (
            <div className="mt-6 rounded-xl border border-background-200/70 bg-background-50 p-5">
              <h3 className="font-heading text-sm font-bold text-foreground-950 mb-1">
                Top 5 — Najczęściej lubiane artykuły
              </h3>
              <p className="text-xs text-foreground-500 mb-4">
                Artykuły z największą liczbą polubień
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.topArticles.map((article, idx) => (
                  <div key={article.slug} className="flex items-center gap-3 rounded-lg border border-background-200/70 bg-background-50 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-foreground-700 truncate">{article.slug}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-red-500 whitespace-nowrap">
                      <i className="ri-heart-fill text-xs"></i>
                      {article.likes}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={fetchDashboard}
              className="inline-flex items-center gap-1.5 rounded-md border border-background-200/70 bg-background-50 px-3 py-2 text-xs font-semibold text-foreground-500 hover:bg-background-100 hover:text-foreground-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center">
                <i className="ri-refresh-line text-xs"></i>
              </span>
              {t('admin.dashboard_retry')}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}