# Setup Guide — Spanish B1 Prep PWA

A progressive web app for offline Spanish B1 exam preparation. Built with React 19, Vite 7, Tailwind CSS 4, and optionally powered by the Claude API for AI-generated daily content.

---

## Recommended: Deploy to Vercel (no local setup needed)

The fastest way to get the app live is to deploy directly from GitHub via Vercel — no terminal required.

### Step 1 — Fork or push the repo to your GitHub account

Make sure the code is in a GitHub repository you own.

### Step 2 — Create a Vercel account

Go to [vercel.com](https://vercel.com) and sign up (free tier is sufficient). Sign in with GitHub.

### Step 3 — Import the project

1. From the Vercel dashboard click **Add New → Project**
2. Select your GitHub repository (`Spanish`)
3. Vercel auto-detects Vite — leave all build settings as-is:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app` within about a minute.

### Step 4 — Add your Anthropic API key (optional)

The app works with its built-in seed content without any API key. To enable AI-generated fresh content each day:

1. In your Vercel project go to **Settings → Environment Variables**
2. Add a new variable:
   - **Name:** `VITE_ANTHROPIC_API_KEY`
   - **Value:** your Anthropic API key
   - **Environments:** Production (and Preview if you want)
3. Click **Save**, then go to **Deployments** and click **Redeploy** on the latest deployment

> **Where to get a key:** Sign up at [console.anthropic.com](https://console.anthropic.com) and create a new API key.

> **Without a key:** The app still works completely — it uses the seed content in `src/data/` for all exercises. AI generation is skipped silently.

### Step 5 — Add PWA icons (optional but recommended)

The PWA manifest references two icon files. Without them the app runs fine, but browsers skip the "Add to Home Screen" prompt.

Add these files to your repo:

```
public/
  icons/
    icon-192x192.png
    icon-512x512.png
```

You can generate correctly-sized PNGs from any logo using [realfavicongenerator.net](https://realfavicongenerator.net) or [maskable.app](https://maskable.app). Commit and push them — Vercel redeploys automatically.

### Automatic redeployments

Every `git push` to your main branch triggers a new Vercel deployment automatically. No manual steps needed.

---

## Alternative: Deploy to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect GitHub and select the `Spanish` repository
3. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Deploy site**
5. Add the API key under **Site settings → Environment variables → Add a variable**:
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: your key
6. Trigger a redeploy from the **Deploys** tab

---

## Local development (optional — for code changes)

Only needed if you want to modify the app. Requires Node.js 18+ installed locally.

```bash
git clone https://github.com/sahil071-ops/Spanish.git
cd Spanish
npm install
```

Create a `.env` file for your API key:

```
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Start the dev server:

```bash
npm run dev
# → http://localhost:5173
```

Build and preview locally before pushing:

```bash
npm run build
npm run preview
# → http://localhost:4173
```

Push your changes — Vercel/Netlify redeploys automatically on push.

---

## Project structure

```
Spanish/
├── public/
│   └── icons/              # PWA icons (icon-192x192.png, icon-512x512.png)
├── src/
│   ├── components/         # Shared UI components
│   ├── context/
│   │   └── AppContext.jsx  # Global state (streak, progress, content counts)
│   ├── data/               # Seed content loaded on first run
│   │   ├── flashcards.json
│   │   ├── grammar.json
│   │   ├── listening.json
│   │   └── mockExams.json
│   ├── pages/              # One file per app screen
│   └── utils/
│       ├── anthropic.js    # Claude API integration for daily content
│       ├── audio.js        # Text-to-speech and audio caching
│       ├── db.js           # IndexedDB helpers
│       ├── seedLoader.js   # Loads seed JSON into IndexedDB on first run
│       └── storage.js      # Spaced repetition logic via localStorage
├── index.html
├── package.json
└── vite.config.js
```

---

## How offline mode works

On first load the app:
1. Reads all seed JSON files from `src/data/`
2. Writes them into IndexedDB (`spanish-b1-db`)
3. The Workbox service worker precaches all static assets

On subsequent loads (even without internet):
- All content is served from IndexedDB and the service worker cache
- Progress and spaced-repetition data are stored in `localStorage`
- Audio blobs are cached in IndexedDB so listened clips stay available offline

When online with an API key set, the app generates a fresh batch of AI content once per day and merges it into the local IndexedDB.

---

## Troubleshooting

**AI content not generating after deploy**
- Confirm `VITE_ANTHROPIC_API_KEY` is set in Vercel/Netlify environment variables
- Trigger a full redeploy after adding the variable — existing deployments do not pick up new env vars automatically
- Check the browser console for `[AI]` prefixed log messages

**PWA install prompt not appearing**
- Add both icon files to `public/icons/` (see Step 5 above) and redeploy
- The prompt only appears on HTTPS — it works on Vercel/Netlify automatically

**Service worker serving stale content after a new deploy**
- The app shows an update banner when a new service worker is available — click it to reload
- Or open DevTools → Application → Service Workers → click "Skip waiting", then refresh
