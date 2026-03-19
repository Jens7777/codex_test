# Proxy for Gemini

Den har mappen innehaller en liten proxy for `POST /api/generate-theory`.

## Varfor separat proxy?

Frontend kan ligga statiskt pa GitHub Pages, men en inbyggd publik API-nyckel ar inte saker i en ren browserapp. Proxyn lagger den hemliga Gemini-nyckeln pa serversidan och skyddar den med:

- atkomstkod
- enkel rate limiting
- CORS
- filvalidering
- strikt JSON-svar

## Rekommenderad gratis setup

Kora proxyn som en gratis Cloudflare Worker eller annan serverless runtime som kan:

- ta emot `multipart/form-data`
- lagra hemligheter som miljovariabler
- svara med CORS till GitHub Pages-domainen

## Miljovariabler

- `GEMINI_API_KEY`
- `ACCESS_CODE`
- `ALLOWED_ORIGIN`
- `GEMINI_MODEL` valfri, default `gemini-2.5-flash`
- `RATE_LIMIT_MAX_REQUESTS` valfri
- `RATE_LIMIT_WINDOW_MS` valfri
- `MAX_FILE_SIZE_BYTES` valfri
- `MAX_TOTAL_SIZE_BYTES` valfri

## Forvantat requestformat

`multipart/form-data` med:

- `accessCode`
- `locale`
- `projectTitle`
- `pastedText`
- `docxText` flera falt tillatna
- `pdfFiles` flera filer tillatna
- `imageFiles` flera filer tillatna

## Svar

JSON:

```json
{
  "theory": {},
  "sourceSummary": {},
  "warnings": []
}
```
