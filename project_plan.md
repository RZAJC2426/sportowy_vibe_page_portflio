# Sportowy VIBE - Redesign

## 1. Project Description
Official website for Sportowy VIBE - a Polish YouTube sports channel by Robert and Michał. The site presents channel news, formats, team info, timeline, stats, goals, partners, and contact. Target audience: sports fans, potential partners, and the community.

## 2. Page Structure
- `/` - Home (single-page with all sections)
- `/aktualnosci` - News / sports disciplines
- `/artykul/:slug` - Article page with comments
- `/nasze-filmy` - Latest YouTube videos from @Sportowy_Vibe (RSS via Supabase Edge Function)
- `/certyfikacja` - Certyfikacja
- `/strefa-kibica` - Fan zone dashboard (profile, activity, quick links)
- `/ustawienia-konta` - Account settings (display name, notifications, theme, language)

## 3. Core Features
- [x] Top bar with live date, time, and weather
- [x] Navigation with logo and section links
- [x] Hero section with sports background
- [x] News/Announcements cards section
- [x] Formats section (video + posts)
- [x] About section with team profiles (Michał & Robert)
- [x] Timeline section showing channel history
- [x] Stats section with global reach map
- [x] Goals section with progress bars
- [x] Partners section with collaboration CTA
- [x] Contact section with form
- [x] Footer
- [x] `/nasze-filmy` - YouTube video grid with auto-refresh (15min), Supabase Edge Function for RSS parsing, DB cache fallback

## 4. Data Model Design
- **youtube_videos_cache** (Supabase): Caches YouTube RSS feed results. Columns: video_id, title, thumbnail_url, published_at, description, views, channel_id, fetched_at.
- **articles** (Supabase): All sport articles (96+). Columns: slug, title, discipline, discipline_slug, date, summary, content, image, featured. RL policies.
- **disciplines** (Supabase): 7 sport disciplines metadata. Columns: slug, name, icon, icon_svg, color, description, hero_image, card_image, latest_headline, sort_order, has_subpage. Cached in memory.
- **channel_news** (Supabase): Channel announcements/ogłoszenia. Columns: id, icon, tag, title, description, news_date, sort_order. Cached in memory.
- **comments** (Supabase): User comments on articles. Columns: id, article_slug, user_id (UUID), user_name, user_avatar, content, created_at. RL policies: anon can SELECT, auth can INSERT/UPDATE/DELETE own.
- **profiles** (Supabase): User profile settings. Columns: id (UUID, FK auth.users), display_name, avatar_url, notifications_enabled, theme, language, created_at, updated_at. RL policies: auth can SELECT/INSERT/UPDATE own.
- Other content is static/mock data served from component files.

## 5. Backend / Third-party Integration Plan
- **Supabase**: Connected. Edge Functions: `youtube-rss-fetcher` for YouTube RSS, `youtube-channel-stats` for channel stats. Auth: Google & Facebook OAuth + email/password via Supabase Auth.
- No Shopify or Stripe.

## 6. Development Phase Plan

### Phase 1: Redesign and rebuild homepage ✅
- Goal: Completely redesign the homepage with a brighter, lighter color palette
- Deliverable: All sections rebuilt with new design, responsive, interactive

### Phase 2: YouTube integration ✅
- Goal: `/nasze-filmy` page with real YouTube data
- Deliverable: Edge Function + DB cache + frontend with auto-refresh

### Phase 3: Auth + Fan Zone + Account Settings ✅
- Goal: Full auth flow with Google, Facebook, email/password. Comments system. Functional account settings.
- Deliverable: `/strefa-kibica` dashboard with user activity, `/ustawienia-konta` with editable display name, theme toggle, language selector, notifications toggle. Comments on articles.

### Phase 4: Account Management + Admin Panel + Gallery ✅
- Goal: Account deletion, admin user/role management, article restoration, photo galleries, auth-aware comments
- Deliverable: Delete account via edge function, `/admin` panel with UsersManager (role management: user/moderator/admin), ArticlesManager with gallery support, gallery display on article pages, comments login opens AuthModal instead of redirecting.
- Database: Added `gallery` JSONB column to articles, RLS policies for admin read/update/delete on profiles.
- Edge Functions: `delete-user-account` — handles cascading delete of comments, profile, and auth user.

### Phase 5: Admin Panel - Content, Colors, Images + Complete Editability ✅
- Goal: Full CMS-like admin panel with text/image/color editing across all pages
- Deliverable: ContentManager, ColorsManager, ImagesManager tabs in admin. All h1-h4 elements wrapped with EditableText+EditableColor. All static images centrally manageable. File upload from computer. Scroll-to-top global button.

### Phase 6: Security - Email Verification + TOTP 2FA ✅
- Goal: Email verification at signup and password change, TOTP two-factor authentication
- Deliverable: Email verification view after signup with resend option. Verification code via Resend before password changes. Google Authenticator (TOTP) setup with QR code scan in account settings.
- Edge Functions: `send-verification-code` (Resend), `totp-verify` (TOTP generate/verify/disable/check).
- Database: Added `totp_secret`, `totp_enabled`, `email_verification_code`, `email_verification_expires_at` columns to profiles.
- Frontend: Readdy Agent widget restored with `mode="chat"`, explicit positioning.

### Phase 7: Custom Email Verification via Resend (Supabase Rate Limit Fix) ✅
- Goal: Eliminate Supabase email rate limit by implementing custom verification flow with Resend
- Deliverable: Custom `register-user` edge function that creates users via Admin API (no Supabase email auto-send), generates verification tokens, sends emails via Resend from noreply@sportowyvibe.pl. New `/weryfikacja-email` full-screen confirmation page with success/expired/invalid states. Updated AuthModal with Resend-based resend. Unverified email warning banner in App.tsx. Auto-verification for Google OAuth users.
- Edge Functions: `register-user` (create user + resend verification), `verify-email-token` (validate token, mark verified)
- Database: Added `verification_token`, `verification_token_expires_at`, `email_verified` columns to profiles.
