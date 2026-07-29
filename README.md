# TRUE FORMULA — PHARMACEUTICAL-GRADE NUTRITION 🌿

> **High-Performance Pharmaceutical-Grade Nutrition Storefront & Subscription Engine**  
> *Engineered with Next.js 14 App Router, TypeScript, TailwindCSS, Supabase PostgreSQL, and Drizzle ORM.*

---

## 🌟 Executive Overview

**TRUE FORMULA** is an agency-grade, luxury e-commerce platform designed for clean-label, pharmaceutical-grade nutrition supplements (Native Whey Isolates, 200-Mesh Micronized Creatine, Bio-Active Marine Collagen, Organic Plant Proteins).

Built with an **Editorial Apothecary** aesthetic, the application provides a seamless bilingual experience (English & French), automated 20% recurring monthly subscriptions, interactive shipment tracking, and an administrator management suite.

---

## 🛠️ Technology Stack & Architecture

### **Core Framework & Frontend**
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router architecture with React Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type-checking)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) with custom design tokens & glassmorphism utilities
- **Typography System**: 
  - `Instrument Serif` (Luxury Editorial Headlines & Brand Logo)
  - `Plus Jakarta Sans` (Clean Modern Interface Body & Controls)
  - `Space Mono` (Pharmaceutical Batch Codes, Lab Data & Pricing)
- **Icons & Motion**: [Lucide React](https://lucide.dev/) & Framer-grade CSS cubic-bezier transitions
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/) rich toast feedback

### **Database & Backend Services**
- **Primary Database**: [Supabase](https://supabase.com/) PostgreSQL with Row Level Security (RLS)
- **ORM / Query Engine**: [Drizzle ORM](https://orm.drizzle.team/)
- **Fallback Engine**: Hybrid Dual-Store System (`MockDatabaseStore` in-memory fallback for offline dev & zero-config testing)
- **Transactional Email**: [Resend API](https://resend.com/) for automated order confirmation & subscription renewal receipts
- **Cron Jobs**: Vercel Cron / API route endpoint (`/api/cron/renew-subscriptions`) with secret authorization protection

---

## ✨ Key Features & Capabilities

### 🛒 **1. Luxury Storefront & Product Catalog**
- **Bilingual Internationalization (i18n)**: Instant English (`en`) and French (`fr`) toggle across the entire application without page reloads.
- **Real-Time Product Search & Filtering**: Instant client-side filtering by formula category (*Whey*, *Creatine*, *Wellness*, *Snacks*, *Plant*, *Pre-Workout*, *Accessories*).
- **Interactive Product Modal**: Flavor swatch selector, size variants, one-time vs. subscription pricing preview (-20% discount calculation), and structural accordions for lab purity certificates.

### 🔄 **2. Recurring Subscription Engine**
- **Automated Discounting**: Subscriptions automatically apply a **20% recurring discount** on all formulas.
- **Customizable Delivery Intervals**: Customers can select and modify delivery cycles (**Every 30, 45, or 60 Days**) directly from their customer portal.
- **Automated Renewal Cron**: `/api/cron/renew-subscriptions` processes due subscriptions, creates new orders, and dispatches email receipts.

### 📦 **3. Customer Portal & Shipment Tracking**
- **Order History & Management**: View past orders, payment status, and order item details.
- **Interactive Shipment Tracking Modal**: Replaces basic alert prompts with a 3-stage delivery timeline (*Order Processed* ➔ *Lab Batch Inspected* ➔ *In Transit with Bio-Luxe Express*), tracking numbers (`BL-EXP-XXXX`), and courier details.

### 🛡️ **4. Administrator Management Suite**
- **KPI Analytics Dashboard**: Real-time total revenue, active subscriber counts, Monthly Recurring Revenue (MRR), and total order metrics calculated directly from database records.
- **Product Management**: Create, update, or remove products and stock quantities.
- **Order & Subscription Controls**: Audit customer orders and subscriber statuses.

### ⚙️ **5. Production Security & Dev Toolbar**
- **Production Mode Lockdown**: Development tools, mock user switchers, and debug panels are automatically disabled in production (`NODE_ENV === 'production'`).
- **Guest-First Security**: Visitors enter in Guest Mode with password-protected authentication.
- **Cron Authorization**: Endpoints protected via `CRON_SECRET` headers.

---

## 🗄️ Database Schemas & DDL

The project includes pre-built PostgreSQL migration scripts in [`lib/db/supabase-schema.sql`](file:///d:/projects/supplumentsstorev2/lib/db/supabase-schema.sql) and [`lib/db/supabase-seed.sql`](file:///d:/projects/supplumentsstorev2/lib/db/supabase-seed.sql).

### **Core Tables**:
- `products`: Product catalog, pricing, category, JSONB flavor & size arrays.
- `profiles`: User accounts, full names, roles (`customer` | `admin`).
- `orders`: Customer purchases, total amounts, shipping address, status (`completed` | `pending` | `failed`).
- `order_items`: Line items linked to orders with flavor and size selections.
- `subscriptions`: Active recurring subscriptions, interval days, next delivery dates, price per cycle.
- `reviews`: Verified buyer testimonials with ratings and initials.

---

## ⚡ Getting Started Locally

### **1. Clone the Repository**
```bash
git clone https://github.com/anasMARZAK/trueformulav2.git
cd trueformulav2
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Set Up Environment Variables**
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
CRON_SECRET=your_custom_cron_secret
RESEND_API_KEY=your_resend_api_key
```

### **4. Run Development Server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project in **[Vercel Dashboard](https://vercel.com/)**.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Project Settings ➔ Environment Variables**.
4. Click **Deploy**.

---

## 📄 License & Credits

- **Design System**: Bio-Luxe Editorial Apothecary Architecture
- **Brand**: TRUE FORMULA — PHARMACEUTICAL-GRADE NUTRITION © 2026. All rights reserved.
