## StyleSwap — Virtual Try-On System

A production-ready virtual try-on web system for clothing showrooms. Customers browse a product catalogue, select a garment, upload a photo, and get an AI try-on result via a session code on a large kiosk display screen.

---

## Tech Stack

- **Next.js 14** — App Router, TypeScript
- **Tailwind CSS** — Custom dark StyleSwap design tokens
- **MongoDB Atlas** — via Mongoose ODM
- **NextAuth.js v5** — Credentials provider, JWT
- **Cloudinary** — Product + session image storage
- **Fashn.ai** — MOCKED in Phase 1 (8s delay, placeholder)
- **qrcode** — QR code generation for shop link

---

## Environment Variables

Create `.env.local` with:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/styleswap?retryWrites=true&w=majority
AUTH_SECRET=<generate: npx auth secret OR openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
FASHN_API_KEY=placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to get each:

| Variable | Where to get |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `AUTH_SECRET` | Run `npx auth secret` in terminal |
| `CLOUDINARY_*` | cloudinary.com → Dashboard → API Keys |
| `FASHN_API_KEY` | fashn.ai (leave as `placeholder` for now) |

---

## Setup

### 1. MongoDB Atlas (free tier)
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free M0 cluster
3. Add a database user
4. Allow network access (0.0.0.0/0 for dev)
5. Get connection string → paste as `MONGODB_URI`

### 2. Cloudinary (free account)
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret from dashboard
3. Create two folders: `products/` and `tryon-sessions/`

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Create first owner account

```bash
npm run seed
# OR
npx ts-node --project tsconfig.seed.json scripts/seed.ts
```

This creates:
- **Email:** `owner@styleswap.demo`
- **Password:** `styleswap123`
- **Shop:** `styleswap-demo` (5 sample products)

---

## Routes

| Path | Description |
|---|---|
| `/login` | Owner login |
| `/signup` | Owner signup / showroom registration |
| `/dashboard` | Owner overview + stats |
| `/dashboard/products` | Product list (add/edit/delete) |
| `/dashboard/shop` | Shop settings + QR code download |
| `/shop/[slug]` | Customer catalogue |
| `/shop/[slug]/product/[id]` | Product detail |
| `/shop/[slug]/tryon` | Upload flow (catalogue OR own cloth) |
| `/shop/[slug]/session` | Session code display + countdown |
| `/kiosk` | Kiosk display (all 4 states) |

### Demo links (after seed):
- Customer shop: [http://localhost:3000/shop/styleswap-demo](http://localhost:3000/shop/styleswap-demo)
- Owner dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- Kiosk: [http://localhost:3000/kiosk](http://localhost:3000/kiosk)

---

## Full Flow

1. **Owner** logs in or registers → adds products with photos → downloads QR code from Shop Settings
2. **Customer** scans QR → lands on `/shop/styleswap-demo`
3. Browses catalogue → filters by category → clicks "Try On" on a product
4. Uploads their full-body photo → clicks "Generate Look"
5. Gets a 6-digit session code → sees countdown timer
6. Goes to kiosk screen → enters code
7. Kiosk shows "Generating your look..." (~8 seconds)
8. Try-on result appears fullscreen on kiosk

---

## Plug in Real Fashn.ai (Phase 2)

1. Get API key from [fashn.ai](https://fashn.ai)
2. Add to `.env.local`: `FASHN_API_KEY=your_real_key`
3. Replace `lib/fashn-mock.ts` with the real API call
   - See [Fashn.ai API docs](https://fashn.ai/docs) for endpoint details

---

## Vercel Deployment

```bash
npm install -g vercel
vercel
```

Set all environment variables in Vercel dashboard → Project Settings → Environment Variables.

> **Important**: Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain.

---

## Security Notes

- All DB and Cloudinary operations are server-side only (API routes / Server Components)
- `CLOUDINARY_API_SECRET` and `MONGODB_URI` are never exposed to the browser
- Dashboard routes are protected by middleware + server-side auth check
- Cross-account access prevention: every dashboard API verifies `shop_id` matches the session owner
- Rate limiting on `/api/tryon/process`: 5 requests/IP/10 minutes
- File validation: MIME type checked, max 5MB per image

---

## Not Built in Phase 1

- Real Fashn.ai API integration (mock only)
- Payment / checkout
- Customer accounts
- Email notifications
- Analytics dashboard
- Multi-shop per owner

---

*Powered by StyleSwap*
#
