# Forandringsteori Studio

Ett ombyggt verktyg for att skapa en klassisk forandringsteori utifran uppladdad kontext. Frontend ar byggd som en statisk React/Vite-app for GitHub Pages, medan AI-anropen gar via en separat proxy for att skydda API-nyckeln.

## Vad appen gor

- tar emot inklistrad text, `docx`, `pdf` och bilder
- extraherar text ur Word-filer direkt i browsern
- skickar underlaget till en proxy som anropar Gemini
- genererar ett strukturerat utkast for forandringsteori
- later anvandaren redigera varje sektion manuellt
- visar en automatisk oversiktsvy over logikkedjan
- autosparar utkast och kallmetadata i `localStorage`
- exporterar utkast som JSON och har utskriftsvanlig vy for PDF

## Frontend lokalt

```bash
npm install
npm run dev
```

Appen letar efter proxy-URL i denna ordning:

1. `window.__APP_CONFIG__.apiBaseUrl` via `public/app-config.js`
2. `VITE_API_BASE_URL`
3. samma origin `/api`

## Tester

```bash
npm run test
```

## GitHub Pages

Workflow finns i [`.github/workflows/deploy-pages.yml`](/C:/Users/jensma/repos/codex_test/.github/workflows/deploy-pages.yml).

For att frontend ska prata med rätt proxy i GitHub Actions, satt repository-variabeln:

- `VITE_API_BASE_URL`

Workflow bygger med:

- `VITE_BASE_PATH=/<repo>/`
- `VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL }}`

## Proxy

Proxykod finns i [`proxy/worker.mjs`](/C:/Users/jensma/repos/codex_test/proxy/worker.mjs).

Se [`proxy/README.md`](/C:/Users/jensma/repos/codex_test/proxy/README.md) och [`proxy/wrangler.toml.example`](/C:/Users/jensma/repos/codex_test/proxy/wrangler.toml.example) for exempel pa deployment med Cloudflare Worker.

Nodvandiga proxy-hemligheter:

- `GEMINI_API_KEY`
- `ACCESS_CODE`

Viktiga proxy-variabler:

- `ALLOWED_ORIGIN`
- `GEMINI_MODEL`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_WINDOW_MS`
- `MAX_FILE_SIZE_BYTES`
- `MAX_TOTAL_SIZE_BYTES`

## Viktiga mappar

```text
src/
  App.jsx
  components/
  nodes/
  utils/
proxy/
.github/workflows/
public/
```
