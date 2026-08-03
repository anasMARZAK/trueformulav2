# ProteinShop Master Fix Plan Task Checklist

## Phase 0 — Auth & Identity
- [x] 0.1 Replace spoofable cookie middleware with `@supabase/ssr` server sessions (C-01)
- [x] 0.2 Hard-gate every admin API route with `verifyAdminServerSession()` (C-02)
- [x] 0.3 Kill email-based role elevation in `AuthContext.tsx` (C-05)
- [x] 0.4 Auto-create profiles on signup via Postgres trigger (C-06)
- [x] 0.5 Seed real UUID users & replace string IDs across app (FIND-04)

## Phase 1 — Database Foundation
- [x] 1.1 Subscriptions & products schema migration (cents, status enum, idempotency key)
- [x] 1.2 Enable RLS on `orders`, `order_items`, `subscriptions`, `profiles`, `products`
- [x] 1.3 Delete ALL `mockDb` read fallbacks in user AND admin routes

## Phase 2 — Persistence & Honesty
- [x] 2.1 Persist subscriptions in checkout to Supabase (FIND-01 / C-03)
- [x] 2.2 Stop swallowing Supabase insert failures & make checkout writes atomic (FIND-05)
- [x] 2.3 Fix Pause/Resume/Cancel API contract + ownership IDOR guard (FIND-02 / C-04)
- [x] 2.4 Create `/api/products` endpoint & invalidate query cache on admin edit (C-07)

## Phase 3 — Make It Actually Recur
- [x] 3.1 Renewal loop reading Supabase filtered by `status='active'`
- [x] 3.2 Renewal idempotency (atomic transaction / unique constraint)
- [x] 3.3 Schedule & protect renewal cron endpoint with `CRON_SECRET`
- [x] 3.4 Re-subscribe business rule enforcement

## Phase 4 — Money Integrity
- [x] 4.1 Integer cents end-to-end (FIND-06)
- [x] 4.2 Checkout idempotency key (FIND-07)

## Phase 5 — State Honesty & Dead Buttons
- [x] 5.1 Complete logout cleanup (clear cart + query cache) (C-08)
- [x] 5.2 Real product popularity score on completed orders (C-09)
- [x] 5.3 Wire delivery cycle selector in subscription portal
- [x] 5.4 Wire admin analytics timeframe toggle
- [x] 5.5 Remove fake credit card inputs from `CheckoutModal.tsx` (FIND-08)

## Phase 6 — Completeness
- [x] 6.1 Variant persistence on one-time orders
- [x] 6.2 Atomic stock decrement via Postgres RPC & renewal stock check
- [x] 6.3 Stripe webhook stub cleanup (FIND-09)
- [x] 6.4 Admin UI order status & subscription cancel actions

## Phase 7 — Full Regression Gate
- [x] 7.1 Run full regression test matrix across all 18 validation criteria
