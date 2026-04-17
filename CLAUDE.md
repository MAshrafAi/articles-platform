# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Arabic-only internal admin platform (RTL) for managing SEO article generation workflows. The long-term goal is to convert an existing n8n workflow (two paths: informational articles + product articles, integrating APIFlash, DataForSEO, OpenAI, Perplexity, Google Drive, Notion) into a web platform managed by an internal team.

**Current phase (Phase 1 — shipped):** authentication foundation and role management. No signup — accounts are created by admins via email invitations. Dashboard is a placeholder; article workflows come in later phases.

## Commands

```bash
npm run dev        # start dev server (Turbopack) at http://localhost:3000
npm run build      # production build
npm run start      # run production build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit — run this before declaring work done

npx supabase db push       # apply pending migrations to the linked remote project
npx supabase migration new <name>   # scaffold a new migration file
```

There is no test suite yet. Verify changes with `npm run typecheck` + `npm run build` + manual browser testing.

## Stack

- **Next.js 16.2.4** App Router + React 19 + TypeScript 5.7
- **Tailwind CSS 3.4** + shadcn/ui (slate base, CSS variables for theming)
- **Supabase**: `@supabase/ssr` for cookie-based sessions, `@supabase/supabase-js` for admin service role
- **Arabic RTL**: `<html lang="ar" dir="rtl">` globally, IBM Plex Sans Arabic via `next/font/google`
- **Forms/toasts**: react-hook-form, zod, sonner

## Architecture

### Authentication flow (the critical path)
Three layers guard every protected route:

1. **[middleware.ts](middleware.ts)** — runs on every request via `updateSession` in [lib/supabase/middleware.ts](lib/supabase/middleware.ts). It refreshes the Supabase session cookie, then:
   - Redirects unauthenticated requests (outside `PUBLIC_PATHS`) to `/login`
   - Looks up `public.users` row by `auth.uid()`. If **missing**, signs the user out and redirects to `/login?error=no_access` — this is the "user exists in `auth.users` but not invited to the platform" guard
   - For `ADMIN_PATHS` (e.g. `/settings/roles`), redirects non-admins (employees) to `/dashboard?error=forbidden`
   - Redirects already-signed-in users away from `/login` to `/dashboard`

2. **[lib/auth.ts](lib/auth.ts)** — `requireUser()` and `requireAdmin()` helpers for server components. These redirect if unmet; `getCurrentUser()` returns `null` instead.

3. **Database RLS + trigger** ([supabase/migrations/20260416000001_users_and_roles.sql](supabase/migrations/20260416000001_users_and_roles.sql)):
   - RLS policies restrict reads/writes based on `public.get_user_role(auth.uid())` (SECURITY DEFINER helper to avoid RLS recursion)
   - Trigger `prevent_last_admin_removal` raises an Arabic error if deleting or demoting would leave zero admins — defense in depth, enforced even if the UI is bypassed

The three layers intentionally overlap: middleware catches the happy path fast, `requireUser/requireAdmin` handle direct server-action calls, and the DB trigger is the last line of defense.

### Supabase client split
Three entry points, pick by context:
- **[lib/supabase/client.ts](lib/supabase/client.ts)** → browser components (`createBrowserClient`)
- **[lib/supabase/server.ts](lib/supabase/server.ts)** → server components and server actions (`createServerClient` with `next/headers` cookies; **always `await createClient()`**)
- **[lib/supabase/admin.ts](lib/supabase/admin.ts)** → service role client (`SUPABASE_SERVICE_ROLE_KEY`), **server-only**. Use for privileged ops that bypass RLS: `generateLink`, `deleteUser`, or reading the full users list on the roles page.

### Route groups
- `app/(protected)/` — anything requiring a logged-in profile. Layout calls `requireUser()` and renders the RTL sidebar.
- `app/login/`, `app/accept-invite/`, `app/auth/callback/`, `app/auth/signout/` — public or transitional routes.

### Invitation flow
**No emails are sent by the platform.** The admin generates a magic link in-app and shares it manually (WhatsApp, Slack, in-person, etc.). This sidesteps Supabase's rate-limited default email service entirely.

1. Admin calls `inviteUserAction` ([app/(protected)/settings/roles/actions.ts](<app/(protected)/settings/roles/actions.ts>)) with `{ email, role }`.
2. `supabaseAdmin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo: <site>/auth/callback?next=/accept-invite } })` creates the `auth.users` row and returns `data.properties.action_link` **without sending an email**.
3. On success, a row is inserted into `public.users` with the chosen role and `full_name: null`. If the insert fails, the `auth.users` entry is rolled back via `deleteUser` to keep the two tables in sync.
4. The action returns `{ ok: true, inviteLink, email }`. [components/invite-dialog.tsx](components/invite-dialog.tsx) displays the link in a copyable field with a "نسخ" button — the admin copies and sends it to the invitee out-of-band.
5. The invitee opens the link → Supabase's `/auth/v1/verify` validates the token and redirects to `/auth/callback` ([page.tsx](app/auth/callback/page.tsx) + [callback-client.tsx](app/auth/callback/callback-client.tsx)) — a **client page** that handles both PKCE `?code=` (via `exchangeCodeForSession`) and implicit-flow `#access_token=` hash fragments (via `setSession`), then redirects to `/accept-invite`.
6. `/accept-invite` is the **dedicated invite-only registration page**: renders the email as a locked, read-only display (no email input — cannot be tampered with), verifies the session user's email matches `public.users.email` (mismatch → signs out + `/login?error=invalid_invite`), and requires **full name + password + confirm password**.
7. `acceptInviteAction` re-runs the email-vs-profile check, calls `supabase.auth.updateUser({ password })`, then writes `full_name` to `public.users`. Redirects to `/dashboard` on success.

### Database schema
- **`public.users`** — FK to `auth.users.id` (cascade). Columns: `id`, `email`, `full_name`, `role` (enum `user_role = 'admin' | 'employee'`, default `'employee'`), `created_at`, `updated_at`. **Role semantics:** `admin` is the elevated role (platform administrator, manages all users + articles); `employee` is the base role (can only see and edit their own articles).
- **`public.articles`** — nanoid-based text primary key (default via `gen_nanoid(12)` helper), FK `author_id → users.id` (cascade), `title text` (nullable), `type` (enum `article_type = 'product' | 'informational'`), `content jsonb` (TipTap doc JSON, default empty doc), `created_at`, `updated_at`. RLS mirrors users pattern: SELECT/UPDATE/DELETE allowed when `author_id = auth.uid()` OR `get_user_role(auth.uid()) = 'admin'`; INSERT requires `author_id = auth.uid()`.

See [supabase/migrations/](supabase/migrations/) for the authoritative schema.

### Articles feature (`/articles`)
- **List page** ([app/(protected)/articles/page.tsx](<app/(protected)/articles/page.tsx>)) — server component. Reads URL searchParams for `preset`, `from`, `to`, `q`, `author`, `sort` and queries `public.articles` directly. RLS takes care of role filtering; no manual `author_id = currentUser.id` needed. Renders [StatsBar](components/articles/stats-bar.tsx) (total + daily average), [ArticlesFilters](components/articles/articles-filters.tsx) (client-side search/filter/sort that updates searchParams), [ArticlesTable](components/articles/articles-table.tsx), and [CreateArticleDialog](components/articles/create-article-dialog.tsx) (stub — toast "قريباً").
- **Author filter** is only rendered for admins; the dropdown uses `supabaseAdmin` (service role) to list all users so the filter isn't subject to RLS of the logged-in user.
- **Detail page** ([app/(protected)/articles/[id]/page.tsx](<app/(protected)/articles/[id]/page.tsx>)) — server component. Uses `maybeSingle()` + `notFound()` — RLS returning null (e.g. an admin opening another admin's article) lands the user on the 404. Delegates to [ArticleEditor](components/articles/article-editor.tsx).
- **Editor** ([components/articles/article-editor.tsx](components/articles/article-editor.tsx)) — TipTap with `StarterKit` + Underline/Link/Placeholder/TextAlign extensions. `immediatelyRender: false` is required (Next.js SSR + TipTap hydration). Autosave is 800ms-debounced, single-flight (next save queued while one is in-flight), and calls `updateArticleAction`. Title lives outside the editor as a plain `<input>`.
- **Shared helpers**: [lib/formatters.ts](lib/formatters.ts) (formatDate / formatDateTime / formatRelativeTime), [lib/date-range.ts](lib/date-range.ts) (presets → date range, label formatting), [lib/articles.ts](lib/articles.ts) (shared types + `EMPTY_DOC`).
- **Sidebar** ([components/sidebar.tsx](components/sidebar.tsx)) has an "المقالات" NavLeaf visible to everyone, active when `pathname` is `/articles` or `/articles/...`.

## Conventions

- **Arabic UI**: all user-facing copy is Arabic. Error messages returned from server actions are Arabic strings intended for direct display via `sonner` toasts.
- **Server Actions over API routes** for mutations (see `*/actions.ts` files). Use `revalidatePath` after writes.
- **shadcn/ui components** live in [components/ui/](components/ui/). App-specific components sit one level up in [components/](components/). Don't duplicate primitives — extend them.
- **RTL gotchas**: `border-l` visually renders on the right in RTL. Use `ms-*`/`me-*` (logical) over `ml-*`/`mr-*` where possible. Dropdown/Dialog primitives need `dir="rtl"` on the **root** component, not on `Content`.
- **Environment**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Optional `NEXT_PUBLIC_SITE_URL` overrides the invite redirect base.
- **Supabase MCP server**: configured in `.mcp.json`. Project ref is `szougpzfzklhmbqxlehr` — always use this ref when invoking MCP tools.

## Manual setup steps (outside this repo)

These are one-time and live in Supabase Studio:
1. First admin `shawkytorky98@gmail.com` is created manually in Authentication → Users (Auto Confirm). The seed migration ([supabase/migrations/20260416000002_seed_admin.sql](supabase/migrations/20260416000002_seed_admin.sql)) then inserts the matching `public.users` row.
2. Auth → URL Configuration: Site URL + Redirect URLs must include the environment's origin (e.g. `http://localhost:3000/**`).
3. **No email template setup needed** — the platform uses `generateLink` and shares the invite link manually. The old Arabic invite email template ([supabase/email-templates/invite-ar.html](supabase/email-templates/invite-ar.html)) is kept in the repo as a reference but is no longer wired into the flow.

## Changelog discipline (IMPORTANT)

**Every time you make a meaningful change to the project, append a one-line summary to the Changelog section below.** This keeps future Claude sessions current without re-reading the whole codebase. Rules:

- One line per change, newest at the top, format: `- YYYY-MM-DD — <short summary> (<affected area>)`
- Include: new features, schema/migration changes, auth/permission changes, stack upgrades, renamed or removed files, new env vars, new manual setup steps
- Skip: trivial fixes (typos, formatting), internal refactors that don't change behavior, dependency patch bumps
- If a change invalidates something written above this section (e.g. a new route group, a new Supabase client, a changed invitation flow), **update the relevant section above too** — the changelog is additive, but the architecture description must stay accurate

## Changelog

- 2026-04-17 — **Renamed role enum values**: old `admin` → `employee`, old `superadmin` → `admin`. UI labels updated in Arabic ("سوبر أدمن" → "أدمن", "أدمن" → "موظف"). Logic/permissions unchanged — `admin` is still the elevated role that can manage users and see all articles. Code: `requireSuperadmin()` → `requireAdmin()`, `SUPERADMIN_PATHS` → `ADMIN_PATHS`, policies/trigger recreated under new names, column default updated to `'employee'`. See [supabase/migrations/20260417000002_rename_roles.sql](supabase/migrations/20260417000002_rename_roles.sql). (roles)
- 2026-04-17 — **Phase 2 shipped (articles management)**. New `/articles` list page (date-range presets + custom picker, title-prefix search, publisher filter for admins, sort toggle, stats cards for total + daily average) and `/articles/[id]` detail page with a full TipTap editor (Bold/Italic/Underline/Strike, H1–H3, lists, blockquote, code block, text alignment, links). Autosave debounced 800ms via `updateArticleAction`. New `public.articles` table with nanoid IDs (via `gen_nanoid` helper), RLS mirroring users pattern (author-or-admin). Create-article dialog is a stub until n8n integration lands. New deps: `@tiptap/*`, `date-fns`, `nanoid`, `@tailwindcss/typography`. Shared helpers: [lib/formatters.ts](lib/formatters.ts), [lib/date-range.ts](lib/date-range.ts), [lib/articles.ts](lib/articles.ts). (articles)
- 2026-04-16 — **Dropped email-based invites**. Switched `inviteUserAction` from `inviteUserByEmail` to `generateLink({ type: 'invite' })`, which returns the magic link without sending an email — sidesteps Supabase's default email rate limit entirely. Invite dialog now shows the generated link with a copy button; admin shares it out-of-band (WhatsApp/Slack/etc). `InviteResult` type now includes `inviteLink` on success. (auth/invite flow)
- 2026-04-16 — Moved full-name entry from invite to acceptance: admin's invite dialog now only accepts email + role; `full_name` is **required** on `/accept-invite` and saved to `public.users` by `acceptInviteAction`. Avoids name-conflict when invitee prefers a different name than what the admin guessed. (auth/invite flow)
- 2026-04-16 — Hardened invite action error handling: `inviteUserAction` now logs Supabase errors and returns specific Arabic messages for rate-limit (`over_email_send_rate_limit`), SMTP failures, and duplicate emails — instead of a single generic fallback. (auth/invite flow)
- 2026-04-16 — Rebuilt invite acceptance: `/auth/callback` is now a client page handling both PKCE code and implicit-flow hash tokens; `/accept-invite` shows email locked (display-only) and verifies it against `public.users` in both the page and server action. Login page now surfaces Arabic errors for `invalid_link` and `invalid_invite`. (auth/invite flow)
- 2026-04-16 — Phase 1 shipped: auth, RTL sidebar, roles page with invite/change-role/delete, Arabic invite email template, migrations applied to remote Supabase
