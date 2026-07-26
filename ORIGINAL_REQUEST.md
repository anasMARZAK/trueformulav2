# Original User Request

## 2026-07-23T19:28:25Z

Develop a full-stack, production-grade e-commerce platform for fitness supplements ("ProteinShop") with single-purchase and 20% recurring monthly subscription models, full bilingual support (English & French), a $0-cost Mock Payment Engine, and an agency-grade "Editorial Apothecary & Bio-Luxe Light" aesthetic.

Working directory: d:/projects/supplumentsstorev2
Integrity mode: development

## Requirements

### R1. Bilingual E-Commerce Storefront & Design System
- Deliver a responsive, high-craft "Editorial Apothecary & Bio-Luxe Light" UI (Warm Ivory `#FDFBF7` canvas, Porcelain White cards, Forest Sage `#2E5A44` accents, Deep Obsidian `#111827` typography, *Instrument Serif* display & *Plus Jakarta Sans* body fonts).
- Provide instant 1-click language switching between **English (EN)** and **French (FR)** across all UI elements, hero banners, product details, purchase toggles, cart drawers, checkout flows, and user dashboards.
- Feature product filtering, search, quantity adjusters, and flavor/size selectors.

### R2. Subscription & Purchase Model (Single vs 20% Monthly Subscription)
- Provide a dual purchase mode on product cards and detail pages: One-Time Purchase vs. Subscribe & Save 20% Monthly.
- Dynamically update prices, cart totals, and discount breakdowns in real time based on the selected purchase mode.
- Maintain cart state persistently via Zustand.

### R3. Zero-Cost ($0) Mock Payment Engine & Stripe Readiness
- Implement a decoupled Payment Adapter Pattern (`IPaymentService`) with a `MockPaymentAdapter` operating in development and staging without requiring Stripe API keys or external charges.
- Simulate checkout completion, order persistence in Supabase PostgreSQL via Drizzle ORM, and subscription status updates (`active`, `paused`, `cancelled`).
- Provide an automated API route (`/api/cron/renew-subscriptions`) and a developer admin toolbar to simulate monthly subscription renewals, payment failures, and localized confirmation emails (via Resend free tier).

### R4. Customer Account Portal & Admin Management Dashboard
- **Customer Space:** Authenticated portal via Supabase Auth allowing users to view order history and manage active subscriptions (pause, resume, or cancel at any time).
- **Admin Space:** Protected dashboard to manage products (add/edit/delete), view active subscriptions, and monitor global sales orders.

---

## Acceptance Criteria

### Core Storefront & Internationalization (EN/FR)
- [ ] Language toggle in the header switches all page copy seamlessly between English and French without layout shift.
- [ ] Product catalog renders with high-quality light-mode AI studio assets stored in `public/images/`.
- [ ] Form entries and checkout fields are validated using Zod schemas with localized error toasts (Sonner).

### Subscription Engine & Checkout Flow
- [ ] Selecting "Subscribe & Save 20%" applies an exact 20% discount to unit prices and updates the order summary dynamically.
- [ ] Mock Checkout successfully records orders and subscription entries in Supabase database tables (`orders`, `subscriptions`).
- [ ] Triggering `/api/cron/renew-subscriptions` creates a new recurring monthly order for all active subscriptions whose next billing date has elapsed.

### Customer & Admin Management
- [ ] Authenticated users can log in, view their active subscriptions, and cancel or pause a subscription with real-time DB updates.
- [ ] Admin panel lists all products, orders, and active subscriptions with full CRUD capabilities.
- [ ] `npm run build` compiles cleanly with zero TypeScript errors or lint warnings.
