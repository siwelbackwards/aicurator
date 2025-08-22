### Auth, Signup, Supabase, and Audit Review

This document summarizes the current signup/auth flows, Supabase configuration, RLS policies, and performance notes, and it lists the recommended actions implemented.

Auth and signup flows
- Buyer signup: `components/auth/buyer-onboarding.tsx`
  - If credentials exist, signs in (`auth.signInWithPassword`). Otherwise, registers via `auth.signUp` with `user_type = buyer` and creates/updates `profiles` and `user_settings` (via RPC `upsert_user_settings` fallback to upsert).
- Seller signup: `components/auth/seller-registration.tsx`
  - Registers via `auth.signUp` with `user_type = seller`, inserts `profiles` and `user_settings`.
- Auth dialog: `components/auth/auth-dialog.tsx` orchestrates `sign-in`/`sign-up`/`buyer-onboarding`/`seller-registration`.
- Callback page: Added `app/auth/callback/page.tsx` to finalize Supabase PKCE flow and redirect to `redirect` query or `/dashboard`.

Supabase client setup
- Browser client: `lib/supabase-client.ts` uses `@supabase/ssr` with PKCE, localStorage, and multi-tab sync. Pulls env from `process.env` and `window.ENV` with dev fallbacks. Detects session in URL and auto refreshes.
- Server admin client: `lib/supabase-server.ts` uses `SUPABASE_SERVICE_ROLE_KEY` for server tasks (e.g., inserting artworks).
- Env injection: `public/env.js`, Netlify plugins (`netlify/plugins/inject-env`) and `netlify.toml` ensure env availability at runtime.

Database schema and policies (relevant)
- Profiles RLS: `supabase/migrations/20240224_fix_profiles_rls.sql` allows insert/update by owner and public select.
- User settings RPC: `supabase/migrations/20240522_create_settings_rpc.sql` creates `upsert_user_settings`.
- Preferences/table setup: `supabase/migrations/complete_profile_schema_fix.sql` and related migrations add missing profile columns and `user_preferences` table with RLS.
- New audit logs: Added `supabase/migrations/20250810_create_audit_logs.sql` with `audit_logs` table, RLS, and `record_audit_event(action, resource_type, resource_id, metadata)` helper.

Performance and config checks
- Next config: `next.config.js` enables remote images, disables type/ESLint blocking, and sets cache TTL.
- Netlify: `netlify.toml` sets CSP, caching for `/_next/static/*`, and includes Lighthouse plugin.
- Search/fetch code uses batched queries and lightweight selects; continued logging is verbose in dev but acceptable.

Action items implemented
- Added `app/auth/callback/page.tsx` to complete Supabase auth redirect flows.
- Added audit logs migration with helper function and RLS.

Recommended follow-ups
- Call `record_audit_event` from critical mutations (profile upsert, settings changes, artwork submission, admin status updates) via Supabase RPC.
- Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in environment.
- Run pending SQL in Supabase (migrations folder) to align schema.



