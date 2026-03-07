# Setup Guide — Spanish B1 Prep PWA

A progressive web app for offline Spanish B1 exam preparation. Built with React 19, Vite 7, Tailwind CSS 4, and optionally powered by the Claude API for AI-generated daily content.

---

## Prerequisites

| Requirement | Minimum version |
|---|---|
| Node.js | 18.x or higher |
| npm | 9.x or higher (bundled with Node) |
| Git | any recent version |

Check your versions:

```bash
node -v
npm -v
```

---

## 1. Clone the repository

```bash
git clone https://github.com/sahil071-ops/Spanish.git
cd Spanish
```

---

## 2. Install dependencies

```bash
npm install
```

This installs all runtime and dev dependencies including React, React Router, Tailwind CSS, Vite, the PWA plugin, and the IndexedDB wrapper (`idb`).

---

## 3. Environment variables

The app works fully offline with its built-in seed content. To enable **AI-generated daily content** (powered by Claude), you need an Anthropic API key.

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following line:

```
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> **Where to get a key:** Sign up at [console.anthropic.com](https://console.anthropic.com), create a new API key, and paste it above.

> **Without a key:** The app still works completely — it uses the seed JSON files in `src/data/` for all content. AI generation is skipped silently when the key is absent or when the device is offline.

---

## 4. Run in development mode

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The development server includes:
- Hot Module Replacement (HMR) for instant updates
- Service Worker enabled in dev mode (PWA features active)
- Tailwind CSS JIT compilation

---

## 5. Build for production

```bash
npm run build
```

Output goes to the `dist/` directory. This build:
- Bundles and minifies all assets
- Generates the service worker via Workbox
- Produces the PWA manifest
- Precaches all JS, CSS, HTML, images, and fonts for offline use

### Preview the production build locally

```bash
npm run preview
```

Opens a local server at [http://localhost:4173](http://localhost:4173) serving the production build.

---

## 6. PWA icons

The PWA manifest references two icon files that must be present:

```
public/
  icons/
    icon-192x192.png
    icon-512x512.png
```

Create the `public/icons/` directory and add your PNG icons at those exact sizes. Without them the app still runs, but browsers may show a warning and the "Add to Home Screen" prompt will not include an icon.

You can generate icons from a source image using any online PWA icon generator, or with a tool like [sharp](https://sharp.pixelplumbing.com/):

```bash
npx sharp-cli resize 192 192 --input logo.png --output public/icons/icon-192x192.png
npx sharp-cli resize 512 512 --input logo.png --output public/icons/icon-512x512.png
```

---

## 7. Deploy

The `dist/` folder is a static site — deploy it anywhere that serves static files.

### Netlify

```bash
npm run build
# drag-and-drop the dist/ folder at app.netlify.com/drop
```

Or connect your GitHub repo and set:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Vercel

```bash
npm i -g vercel
vercel
# follow the prompts; Vercel auto-detects Vite
```

### GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `package.json` scripts:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Then run:

```bash
npm run deploy
```

> **Important:** For GitHub Pages, set `base: '/Spanish/'` in `vite.config.js` to match your repo name.

---

## 8. Available npm scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build optimised production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across all source files |

---

## 9. Project structure

```
Spanish/
├── public/
│   └── icons/              # PWA icons (add manually — see step 6)
├── src/
│   ├── components/         # Shared UI components
│   │   ├── AudioPlayer.jsx
│   │   ├── BottomNav.jsx
│   │   ├── FlashCard.jsx
│   │   ├── OfflineBanner.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── TopBar.jsx
│   │   └── UpdateBanner.jsx
│   ├── context/
│   │   └── AppContext.jsx  # Global state (streak, progress, content counts)
│   ├── data/               # Seed content loaded on first run
│   │   ├── flashcards.json
│   │   ├── grammar.json
│   │   ├── listening.json
│   │   └── mockExams.json
│   ├── pages/
│   │   ├── FlashcardsPage.jsx
│   │   ├── GrammarPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── ListeningPage.jsx
│   │   ├── MockExamPage.jsx
│   │   ├── PracticePage.jsx
│   │   ├── ProgressPage.jsx
│   │   ├── ReadingPage.jsx
│   │   └── SettingsPage.jsx
│   ├── utils/
│   │   ├── anthropic.js    # Claude API integration for daily content
│   │   ├── audio.js        # Text-to-speech and audio caching
│   │   ├── db.js           # IndexedDB helpers via idb
│   │   ├── seedLoader.js   # Loads seed JSON into IndexedDB on first run
│   │   └── storage.js      # SRS (spaced repetition) logic via localStorage
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── .env                    # Your API key (create this — not in git)
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

---

## 10. How offline mode works

On first load the app:
1. Reads all seed JSON files from `src/data/`
2. Writes them into IndexedDB (`spanish-b1-db`) via `seedLoader.js`
3. The Workbox service worker precaches all static assets

On subsequent loads (even with no internet):
- All content is served from IndexedDB and the service worker cache
- Progress and spaced-repetition data are stored in `localStorage`
- Audio blobs are stored in IndexedDB so listened clips remain available offline

When back online with an API key set, the app generates a fresh batch of AI content once per day and merges it into IndexedDB alongside the seed data.

---

## 11. Troubleshooting

**`npm install` fails**
- Ensure Node 18+ is installed: `node -v`
- Delete `node_modules` and `package-lock.json`, then retry: `rm -rf node_modules package-lock.json && npm install`

**Service worker not updating in dev**
- Hard-refresh with `Shift+Ctrl+R` (or `Shift+Cmd+R` on Mac)
- Or open DevTools → Application → Service Workers → click "Unregister", then reload

**AI content not generating**
- Confirm `VITE_ANTHROPIC_API_KEY` is set in `.env` (not `.env.local` or `.env.production`)
- Restart the dev server after changing `.env`
- Check the browser console for `[AI]` prefixed log messages

**Icons missing / PWA install prompt not appearing**
- Add the required PNG files to `public/icons/` (see step 6)
- Run a production build and test with `npm run preview` — PWA install prompts do not always appear in dev mode

**Port already in use**
- Vite defaults to port 5173; specify another: `npm run dev -- --port 3000`
