# Cursor Usage Dashboard

A dark-mode dashboard for your **Cursor.com** usage: plan limits, token breakdown, charts, and recent activity. Data comes from your live Cursor session—no mock data when configured.

Optional: scheduled screenshot + post to **Google Chat** (see [Daily report](#daily-report)).

---

## Quick start

**Requirements:** Node 20+, npm 10+

```bash
git clone <your-repo-url> cursor-usage-dashboard
cd cursor-usage-dashboard
npm install
npx playwright install --with-deps chromium
cp .env.example .env.local
```

Add your session token to `.env.local` (see below), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Session token

1. Sign in at [cursor.com](https://cursor.com).
2. DevTools → **Application** → **Cookies** → `cursor.com`.
3. Copy the value of **`WorkosCursorSessionToken`**.
4. Set it in `.env.local`:

```env
CURSOR_SESSION_TOKEN=your_token_here
```

If the dashboard errors with 401/403, sign in again and refresh the token.

**Optional env vars** (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `CURSOR_USER_ID` | Fallback if account lookup fails |
| `CURSOR_TEAM_ID` | Team filter (default `0` = personal) |
| `GOOGLE_CHAT_WEBHOOK` | For daily screenshot reports |
| `NEXT_PUBLIC_BASE_URL` | Base URL for capture scripts (default `http://localhost:3000`) |

---

## Daily report

To capture the dashboard and send the image to Google Chat:

1. Create a webhook in your Chat space (**Apps & integrations** → **Manage webhooks**). Requires Google Workspace.
2. Set `GOOGLE_CHAT_WEBHOOK` in `.env.local`.
3. With the app running:

```bash
npm run daily-report
```

For automated weekday runs, add `CURSOR_SESSION_TOKEN` and `GOOGLE_CHAT_WEBHOOK` as GitHub Actions secrets—the workflow in `.github/workflows/daily-report.yml` handles the rest.

---

## License

MIT.
