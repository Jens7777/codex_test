# Förändringsteori Studio

**Verktyget:** https://jens7777.github.io/codex_test/

Ett verktyg för att skapa en klassisk förändringsteori utifrån uppladdad kontext. Frontend är byggd som en statisk React/Vite-app för GitHub Pages, medan AI-anropen går via en separat proxy för att skydda API-nyckeln.

## Vad appen gör

- tar emot inklistrad text, `docx`, `pdf` och bilder
- extraherar text ur Word-filer direkt i browsern
- skickar underlaget till en proxy som anropar Gemini
- genererar ett strukturerat utkast för förändringsteori
- låter användaren redigera varje sektion manuellt
- visar en automatisk översiktsvy över logikkedjan
- autosparar utkast och källmetadata i `localStorage`
- exporterar utkast som JSON och har utskriftsvänlig vy för PDF

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

Workflow finns i [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

För att frontend ska prata med rätt proxy i GitHub Actions, sätt repository-variabeln:

- `VITE_API_BASE_URL`

Workflow bygger med:

- `VITE_BASE_PATH=/<repo>/`
- `VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL }}`

## Proxy

Proxykod finns i [`proxy/worker.mjs`](proxy/worker.mjs).

Se [`proxy/README.md`](proxy/README.md) och [`proxy/wrangler.toml.example`](proxy/wrangler.toml.example) för exempel på deployment med Cloudflare Worker.

Nödvändiga proxy-hemligheter:

- `GEMINI_API_KEY`

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
