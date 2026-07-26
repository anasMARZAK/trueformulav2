# Project: ProteinShop

## Architecture
Full-stack Next.js 14+ App Router e-commerce platform for fitness supplements ("ProteinShop"). Tech stack:
- Framework: Next.js 14+ App Router, TypeScript, React 18/19
- Styling & Aesthetic: Tailwind CSS + shadcn/ui with "Editorial Apothecary & Bio-Luxe Light" theme (`#FDFBF7` Warm Ivory canvas, `#2E5A44` Forest Sage accents, `#111827` Deep Obsidian typography, *Instrument Serif* display font, *Plus Jakarta Sans* body font).
- Database & ORM: Supabase PostgreSQL + Drizzle ORM (`profiles`, `products`, `orders`, `order_items`, `subscriptions`).
- State Management: Zustand persistent state (`useCartStore`) supporting dynamic 20% discount calculations for subscriptions.
- Payment Architecture: Decoupled Payment Adapter Pattern (`IPaymentService`) with `MockPaymentAdapter` operating in $0-cost development mode.
- i18n: Centralized EN/FR translation engine with 1-click header switcher.
- Cron & Admin Tools: `/api/cron/renew-subscriptions` route + `DevToolbar.tsx` simulator.
- Portals: Authenticated customer space (`/account`) with subscription pause/resume/cancel controls + Admin dashboard (`/admin`) with product CRUD, orders, and subscriptions management.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Bootstrap & Database Infrastructure | Next.js 14+ setup, Tailwind Bio-Luxe theme, Drizzle ORM schema, DB client/seed & product images | none | DONE |
| M2 | Storefront UI & i18n Engine | Header, Hero, i18n dictionaries (EN/FR), Product catalog, Product Detail modal, search/filter/sort | M1 | DONE |
| M3 | Dual Purchase Model & Zustand Cart | Zustand persistent cart, 20% Subscribe & Save price engine, flavor/size selectors, cart drawer | M2 | DONE |
| M4 | Mock Payment Engine & Cron Renewal Route | `IPaymentService` interface, `MockPaymentAdapter`, `/api/checkout`, `/api/cron/renew-subscriptions`, `DevToolbar` | M3 | DONE |
| M5 | Customer Portal & Admin Dashboard | Supabase Auth, `/account` portal (pause/resume/cancel subs, orders), `/admin` dashboard (Product CRUD, subs, orders) | M4 | DONE |
| M6 | End-to-End Build & E2E Hardening | `npm run build` verification, zero TS errors, full E2E testing validation, Forensic Audit | M5 | DONE |

## Interface Contracts
### Payment Service Contract (`lib/payment/types.ts`)
- `processPayment(orderData: OrderRequest): Promise<PaymentResult>`
- `createSubscription(subData: SubscriptionRequest): Promise<SubscriptionResult>`
- `updateSubscriptionStatus(id: string, status: 'active' | 'paused' | 'cancelled'): Promise<boolean>`
- `renewDueSubscriptions(): Promise<RenewalResult>`

### i18n Engine Contract (`lib/i18n/useLanguage.ts`)
- `useLanguage()` -> `{ locale: 'en' | 'fr', setLocale: (loc: 'en' | 'fr') => void, t: Dictionary }`

### Zustand Cart Store (`lib/store/useCartStore.ts`)
- `items: CartItem[]`
- `addItem(item: Omit<CartItem, 'id'>): void`
- `removeItem(id: string): void`
- `updateQuantity(id: string, quantity: number): void`
- `togglePurchaseType(id: string): void`
- `clearCart(): void`

## Code Layout
- `app/` (Next.js App Router: page routes, layout, API routes)
  - `page.tsx` (Storefront home)
  - `account/page.tsx` (Customer portal)
  - `admin/page.tsx` (Admin dashboard)
  - `api/checkout/route.ts`
  - `api/cron/renew-subscriptions/route.ts`
- `components/`
  - `storefront/` (Header, Hero, ProductGrid, ProductCard, ProductDetailModal)
  - `cart/` (CartDrawer, CheckoutModal)
  - `portal/` (SubscriptionsManager, OrderHistory)
  - `admin/` (ProductCrudTable, ProductModal, AdminSubsOverview, AdminOrdersOverview)
  - `ui/` (DevToolbar, ThemeProvider, Toast, Button, Input, Modal, Badge)
- `lib/`
  - `db/` (schema.ts, index.ts, seed.ts)
  - `i18n/` (dictionaries/en.ts, fr.ts, useLanguage.ts)
  - `store/` (useCartStore.ts)
  - `payment/` (IPaymentService.ts, MockPaymentAdapter.ts)
  - `supabase/` (client.ts, server.ts)
- `public/images/` (supplement product photography/renders)
