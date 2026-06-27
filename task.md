# StyleSwap Build — Task Tracker

## Phase 1 — Project Scaffold
- [x] Run create-next-app@14
- [x] Apply StyleSwap Tailwind design tokens
- [x] Set up Google Fonts (Inter) in layout
- [x] Configure tsconfig strict mode + path aliases
- [x] Create .env.local template

## Phase 2 — MongoDB + Models
- [x] lib/mongodb.ts (cached connection)
- [x] models/User.ts
- [x] models/Shop.ts
- [x] models/Product.ts
- [x] models/TryonSession.ts

## Phase 3 — Auth
- [x] Install next-auth@beta + bcryptjs
- [x] auth.ts (credentials provider, JWT)
- [x] middleware.ts (protect /dashboard/*)
- [x] app/(auth)/login/page.tsx
- [x] app/(auth)/signup/page.tsx (New Registration Flow)
- [x] app/api/auth/signup/route.ts (New Registration API)

## Phase 4 — Utilities
- [x] lib/cloudinary.ts
- [x] lib/rate-limit.ts
- [x] lib/fashn-mock.ts
- [x] lib/utils.ts

## Phase 5 — Owner Dashboard: Products CRUD
- [x] API: POST/PUT/DELETE /api/dashboard/products
- [x] /dashboard/products list page
- [x] /dashboard/products/new page
- [x] /dashboard/products/[id] edit page
- [x] components/dashboard/ProductForm.tsx
- [x] components/dashboard/ImageUploader.tsx

## Phase 6 — Owner Dashboard: Shop + QR
- [x] API: PUT /api/dashboard/shop
- [x] /dashboard/shop page
- [x] QR code generation + download

## Phase 7 — Owner Dashboard: Overview
- [x] /dashboard page (stats)
- [x] Dashboard layout (nav + logout)

## Phase 8 — Customer: Shop Catalogue
- [x] API: GET /api/shop/[slug] + /api/shop/[slug]/products
- [x] /shop/[slug] catalogue page
- [x] components/catalogue/ProductCard.tsx
- [x] components/catalogue/FilterChips.tsx

## Phase 9 — Customer: Product Detail
- [x] API: GET /api/shop/[slug]/products/[id]
- [x] /shop/[slug]/product/[id] page
- [x] Image gallery component

## Phase 10 — Customer: Try-On Upload Flow
- [x] /shop/[slug]/tryon page (both modes)
- [x] components/tryon/UploadZone.tsx

## Phase 11 — API: Try-On Process + Session Poll
- [x] POST /api/tryon/process
- [x] GET /api/tryon/session?code=

## Phase 12 — Customer: Session Code Display
- [x] /shop/[slug]/session page
- [x] Countdown timer + polling

## Phase 13 — Kiosk Display
- [x] /kiosk page (all 4 states)
- [x] components/kiosk/* state components

## Phase 14 — Seed Script
- [x] scripts/seed.ts

## Phase 15 — README + Verification
- [x] README.md
- [x] End-to-end check
