# Reviewz

An AI-powered Google review funnel for local businesses. Merchants generate a QR code → customers scan it → happy customers get AI-written review suggestions to post on Google → unhappy customers submit private feedback directly to the merchant's dashboard.

## Features

- **Email OTP sign-in** — no password required, secured by Supabase Auth
- **QR code per business** — works on any device (data stored in Supabase, not localStorage)
- **AI review generation** — uses GPT-4o-mini (OpenAI) to write 3 unique, business-specific reviews; falls back to curated templates if no API key is set
- **Smart routing** — 4-5★ → Google review suggestions; 1-3★ → private feedback form
- **Dashboard** — real scan count, rating distribution, private feedback inbox
- **Safe editing** — editing business details preserves the existing UUID so printed QR codes keep working

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Auth + DB | Supabase (PostgreSQL + Row Level Security) |
| AI | OpenAI GPT-4o-mini (optional) |
| Icons | Lucide React |
| QR | react-qr-code |

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-review-assistant
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional — enables real AI review generation
VITE_OPENAI_API_KEY=sk-...
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.jsx     # Supabase session state
├── lib/
│   └── supabase.js         # Supabase client
├── components/
│   ├── Navbar.jsx
│   └── LoadingSpinner.jsx
├── pages/
│   ├── LandingPage.jsx
│   ├── SignIn.jsx           # Email OTP (2-step)
│   ├── BusinessSetup.jsx    # Create / edit business
│   ├── Dashboard.jsx        # Owner analytics
│   ├── CustomerReview.jsx   # Star rating (public)
│   ├── ReviewSuggestions.jsx # AI review options (public)
│   └── PrivateFeedback.jsx  # Negative feedback form (public)
└── utils/
    └── reviewGenerator.js   # OpenAI + template fallback

supabase/
└── schema.sql               # Tables + RLS policies
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `businesses` | One row per merchant, linked to `auth.users` |
| `scans` | One row per QR page load — used for accurate scan count |
| `reviews` | Ratings + optional feedback from customers |

Row Level Security ensures:
- Merchants can only see their own data
- Customers can insert scans and reviews without an account
- Business info is publicly readable (required for QR page)

## Deployment

Build for production:

```bash
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

Set the same environment variables in your hosting platform's dashboard.

> **Note:** Make sure your Supabase project's **Site URL** and **Redirect URLs** include your production domain under **Authentication → URL Configuration**.
