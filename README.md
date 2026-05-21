# Cursor Usage Dashboard

A production-ready, dark-mode-first dashboard that visualizes **Cursor.com** usage in a Codex-style UI, captures a screenshot on a schedule, and posts a formatted report to **Google Chat**.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui** primitives, **Recharts**, **Playwright**, and **GitHub Actions**. Deployable to **Vercel**.

---

## Data sources

The app fetches three Cursor endpoints (all session-cookie authenticated):

| Endpoint | Purpose |
| --- | --- |
| `GET https://cursor.com/api/usage-summary` | Plan, billing cycle, percentages, breakdown |
| `GET https://cursor.com/api/auth/me` | Logged-in user → resolves `user.id` for the next call |
| `GET https://cursor.com/api/usage?user=<id>` | Per-model request/token counts |

All three are hit through `lib/fetchUsage.ts`, which sends a `Cookie: WorkosCursorSessionToken=…` header.

---

## Features

- Summary cards: Total %, Included tokens, Bonus tokens, Remaining tokens, Plan, Cycle
- Animated gradient progress bars: Total / API / Auto model
- Recharts: daily token area chart, requests bar chart, model breakdown pie
- Logged-in account shown in header (name + email from `/api/auth/me`)
- `/api/usage` server route with retries, timeout, schema validation, mock fallback in dev
- Auto-refresh every 5 minutes + manual refresh
- Export JSON / download full-dashboard PNG (Playwright, same as CI)
- Playwright screenshot → PNG artifact
- Google Chat webhook posts **only the full dashboard screenshot** (no text summary)
- GitHub Actions: **19:00 IST, Monday–Friday only** (weekends excluded)
- Mobile responsive, glassmorphism cards, gradient accents

---

## Installation

Prereqs: **Node 20+**, **npm 10+**.

```bash
git clone <your-repo-url> cursor-usage-dashboard
cd cursor-usage-dashboard
npm install
npx playwright install --with-deps chromium
cp .env.example .env.local
```

Fill in `.env.local`:

```env
CURSOR_SESSION_TOKEN=eyJhbGciOi...            # WorkosCursorSessionToken cookie value
CURSOR_USER_ID=                                # optional fallback
GOOGLE_CHAT_WEBHOOK=https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

If `CURSOR_SESSION_TOKEN` is empty, the dashboard renders the bundled mock fixtures (matches the real response shapes), useful for local UI work.

---

## Getting `CURSOR_SESSION_TOKEN`

1. Open `https://cursor.com` in a browser and sign in.
2. Open **DevTools → Application → Cookies → `https://cursor.com`**.
3. Find the row named **`WorkosCursorSessionToken`** and copy its **Value**.
4. Paste it as `CURSOR_SESSION_TOKEN` in `.env.local` (and as a GitHub Actions secret).

Heads-up: this cookie is a session credential and will rotate when you log out or after a long period. If the dashboard starts returning 401/403, refresh it from your browser.

---

## Getting `GOOGLE_CHAT_WEBHOOK`

1. Open the **Google Chat space** you want to post into (web app `mail.google.com/chat` or the Google Chat app).
2. Click the **space name** at the top → **Apps & integrations**.
3. Click **+ Add webhooks**. (You must be a space manager. Webhooks require a **paid Google Workspace** account — they don’t work in personal `@gmail.com` chats or DMs.)
4. Name it (e.g. `Cursor Usage Bot`), optional avatar URL → **Save**.
5. Click the **copy** icon next to the new entry → that URL is your `GOOGLE_CHAT_WEBHOOK`.

It looks like:

```
https://chat.googleapis.com/v1/spaces/AAAA…/messages?key=…&token=…
```

Test it quickly with curl:

```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"Hello from Cursor Usage Dashboard"}' \
  "$GOOGLE_CHAT_WEBHOOK"
```

---

## Run locally

```bash
npm run dev                    # http://localhost:3000
```

Capture + send report against your local dev server:

```bash
npm run build && npm run start &
npx wait-on http://localhost:3000
npm run daily-report           # capture + send
```

---

## Project structure

```
.
├── app/
│   ├── api/usage/route.ts        # server route returning the merged dashboard payload
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/{button,card,badge}.tsx
│   ├── BillingCard.tsx
│   ├── Dashboard.tsx
│   ├── DailyUsageChart.tsx
│   ├── DashboardSkeleton.tsx
│   ├── ErrorState.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── ProgressUsageBar.tsx
│   ├── RequestsBarChart.tsx
│   ├── UsageCard.tsx
│   └── UsagePieChart.tsx
├── hooks/useUsage.ts             # client hook: fetch, refresh, auto-poll
├── lib/
│   ├── fetchUsage.ts             # Cursor API client (3 endpoints) with retries, timeout, validation
│   ├── googleChat.ts             # screenshot-only Google Chat card
│   ├── mockData.ts               # sample summary / auth-me / usage-detail
│   └── utils.ts
├── scripts/
│   ├── capture.ts                # Playwright screenshot of dashboard
│   └── sendReport.ts             # posts dashboard PNG to Google Chat
├── types/usage.ts                # types matching the Cursor JSON responses
├── .github/workflows/daily-report.yml
├── .env.example
├── playwright.config.ts
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── vercel.json
```

---

## GitHub Actions

Workflow: `.github/workflows/daily-report.yml`.

Repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Required | Purpose |
| --- | --- | --- |
| `CURSOR_SESSION_TOKEN` | yes | `WorkosCursorSessionToken` cookie value |
| `CURSOR_USER_ID` | optional | fallback if `/api/auth/me` fails |
| `GOOGLE_CHAT_WEBHOOK` | yes | where to post the report |

**Schedule:** `30 13 * * 1-5` UTC = **19:00 IST, Monday through Friday** (Saturday/Sunday skipped). You can also trigger it manually from the **Actions** tab via **Run workflow**.

Each run:

1. Installs deps + Playwright Chromium
2. Builds and starts the Next.js app
3. Captures `usage-report.png`
4. Uploads it as a workflow artifact (14 day retention)
5. Publishes a public image URL and sends **only that screenshot** to Google Chat (no usage text)

**Google Chat = screenshot only**

The group message is a single card with the dashboard PNG — no usage percentages or account lines. `SCREENSHOT_URL` must be publicly reachable (Google cannot load private `raw.githubusercontent.com` links). **Public repos:** the workflow commits to `dashboard-screenshot` and uses GitHub’s `download_url`. **Private repos:** set a `SCREENSHOT_URL` repository secret (Cloudinary/S3/R2). The full PNG is always in the workflow **artifact** if you need a backup.

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. On Vercel → **Add New Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Set environment variables under **Settings → Environment Variables**:
   - `CURSOR_SESSION_TOKEN`
   - `CURSOR_USER_ID` *(optional)*
   - `GOOGLE_CHAT_WEBHOOK` *(only needed if you also report from Vercel functions)*
   - `NEXT_PUBLIC_BASE_URL` → your `https://<project>.vercel.app`
5. Deploy.

`vercel.json` pins the framework and install/build commands.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run capture` | Playwright screenshot → `public/usage-report.png` |
| `npm run publish-screenshot` | Upload PNG and print public URL (for `SCREENSHOT_URL`) |
| `npm run report` | Post dashboard screenshot to Google Chat |
| `npm run daily-report` | Capture + report in sequence |

---

## Troubleshooting

**Dashboard shows mock data**
`CURSOR_SESSION_TOKEN` is empty. Set it in `.env.local` (dev) or as a GitHub/Vercel secret (prod).

**Cursor returns 401/403**
The session cookie has expired. Sign back into cursor.com, copy a fresh `WorkosCursorSessionToken`, update the secret.

**`/api/usage?user=…` is empty / 404**
`/api/auth/me` couldn’t resolve the user — set `CURSOR_USER_ID` explicitly as a fallback.

**Playwright fails on `[data-dashboard-ready]`**
The dashboard renders an error state if the upstream call fails — verify by hitting `/api/usage` in the browser first.

**Google Chat webhook 404 / 401**
Re-copy the URL from the space’s **Manage webhooks** menu; truncated URLs are the most common cause. Personal `@gmail.com` accounts can’t create webhooks.

**Chart animations clipped in the screenshot**
Increase the `page.waitForTimeout(1500)` in `scripts/capture.ts` — Recharts animations are 900ms and progress bars are 1000ms.

---

## License

MIT.
