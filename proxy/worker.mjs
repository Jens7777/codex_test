const rateLimitStore = new Map();

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_FILE_SIZE = 8 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_SIZE = 20 * 1024 * 1024;

const stringSchema = {
  type: 'STRING'
};

const stringArraySchema = {
  type: 'ARRAY',
  items: stringSchema
};

const theoryResponseSchema = {
  type: 'OBJECT',
  properties: {
    projectTitle: stringSchema,
    problem: stringSchema,
    targetGroups: stringArraySchema,
    inputs: stringArraySchema,
    activities: stringArraySchema,
    outputs: stringArraySchema,
    shortTermOutcomes: stringArraySchema,
    longTermOutcomes: stringArraySchema,
    impact: stringSchema,
    assumptions: stringArraySchema,
    indicators: stringArraySchema,
    evidenceGaps: stringArraySchema,
    confidenceNotes: stringArraySchema,
    sourceSummary: {
      type: 'OBJECT',
      properties: {
        summary: stringSchema,
        sourceHighlights: stringArraySchema
      },
      required: ['summary', 'sourceHighlights']
    },
    warnings: stringArraySchema
  },
  required: [
    'projectTitle',
    'problem',
    'targetGroups',
    'inputs',
    'activities',
    'outputs',
    'shortTermOutcomes',
    'longTermOutcomes',
    'impact',
    'assumptions',
    'indicators',
    'evidenceGaps',
    'confidenceNotes',
    'sourceSummary',
    'warnings'
  ]
};

const trim = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeList = (value, prefix) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const text = trim(item);
      if (!text) {
        return null;
      }

      return {
        id: `${prefix}-${index + 1}`,
        text
      };
    })
    .filter(Boolean);
};

const normalizeSourceSummary = (value) => {
  const sourceSummary = value && typeof value === 'object' ? value : {};
  return {
    summary: trim(sourceSummary.summary),
    sourceHighlights: normalizeList(sourceSummary.sourceHighlights, 'highlight')
  };
};

export const normalizeModelPayload = (payload) => {
  const source = payload && typeof payload === 'object' ? payload : {};

  return {
    theory: {
      projectTitle: trim(source.projectTitle),
      problem: trim(source.problem),
      targetGroups: normalizeList(source.targetGroups, 'target-group'),
      inputs: normalizeList(source.inputs, 'input'),
      activities: normalizeList(source.activities, 'activity'),
      outputs: normalizeList(source.outputs, 'output'),
      shortTermOutcomes: normalizeList(source.shortTermOutcomes, 'short-outcome'),
      longTermOutcomes: normalizeList(source.longTermOutcomes, 'long-outcome'),
      impact: trim(source.impact),
      assumptions: normalizeList(source.assumptions, 'assumption'),
      indicators: normalizeList(source.indicators, 'indicator'),
      evidenceGaps: normalizeList(source.evidenceGaps, 'evidence-gap'),
      confidenceNotes: normalizeList(source.confidenceNotes, 'confidence-note')
    },
    sourceSummary: normalizeSourceSummary(source.sourceSummary),
    warnings: Array.isArray(source.warnings) ? source.warnings.map(trim).filter(Boolean) : []
  };
};

const buildCorsHeaders = (request, env) => {
  const allowedOrigin = trim(env.ALLOWED_ORIGIN) || '*';
  const requestOrigin = request.headers.get('Origin');
  const origin =
    allowedOrigin === '*'
      ? '*'
      : allowedOrigin
          .split(',')
          .map((item) => item.trim())
          .find((item) => item === requestOrigin) || allowedOrigin.split(',')[0].trim();

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
};

const jsonResponse = (request, env, data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...buildCorsHeaders(request, env)
    }
  });

const getClientKey = (request, accessCode) => {
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `${ip}:${accessCode}`;
};

export const checkRateLimit = (request, env, accessCode) => {
  const limit = Number.parseInt(env.RATE_LIMIT_MAX_REQUESTS || '5', 10);
  const windowMs = Number.parseInt(env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const now = Date.now();
  const clientKey = getClientKey(request, accessCode);
  const previousEntries = rateLimitStore.get(clientKey) ?? [];
  const activeEntries = previousEntries.filter((timestamp) => now - timestamp < windowMs);

  if (activeEntries.length >= limit) {
    return false;
  }

  activeEntries.push(now);
  rateLimitStore.set(clientKey, activeEntries);
  return true;
};

const base64FromArrayBuffer = (arrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
};

const ensureFile = (value) => value && typeof value === 'object' && typeof value.arrayBuffer === 'function';

export const validateFiles = (files, allowedTypes, maxSize) => {
  files.forEach((file) => {
    if (!ensureFile(file)) {
      throw new Error('En uppladdad fil kunde inte tolkas.');
    }

    const mimeType = file.type || '';

    if (
      !allowedTypes.some((type) =>
        type.endsWith('/*') ? mimeType.startsWith(type.slice(0, -1)) : mimeType === type
      )
    ) {
      throw new Error(`Filtypen ${file.type || file.name} ar inte tillaten.`);
    }

    if (file.size > maxSize) {
      throw new Error(`${file.name} overskrider maximal filstorlek.`);
    }
  });
};

const getGeminiPrompt = ({ locale, projectTitle, pastedText, docxTexts, pdfCount, imageCount }) => `
Du ar en erfaren analytiker som ska skapa en svensk forandringsteori i klassisk struktur.

Svara ENDAST med JSON enligt schemat.
Sprak: ${locale === 'sv' ? 'svenska' : locale}
Titel: ${projectTitle || 'Inte angivet'}

Instruktioner:
- Tolka allt underlag samlat.
- Var konkret och skriv kortfattat men anvandbart.
- Om underlaget ar oklart, fyll inte i med hallucinerade detaljer. Markera i stallet oklara delar under evidenceGaps eller confidenceNotes.
- sourceSummary.summary ska ge en kort bild av vad underlaget handlar om.
- sourceSummary.sourceHighlights ska lista 3-6 viktiga teman eller saker som underlaget verkar fokusera pa.
- warnings ska endast innehalla verkliga osakerheter eller begransningar.

Textunderlag:
${pastedText || '(Inget inklistrat textunderlag)'}

Extraherad Word-text:
${docxTexts.length > 0 ? docxTexts.map((text, index) => `Dokument ${index + 1}:\n${text}`).join('\n\n') : '(Ingen Word-text)'}

Bilagor:
- PDF-filer: ${pdfCount}
- Bildfiler: ${imageCount}
`;

const buildGeminiParts = async ({ prompt, pdfFiles, imageFiles }) => {
  const parts = [{ text: prompt }];

  for (const file of pdfFiles) {
    parts.push({
      inlineData: {
        mimeType: file.type || 'application/pdf',
        data: base64FromArrayBuffer(await file.arrayBuffer())
      }
    });
  }

  for (const file of imageFiles) {
    parts.push({
      inlineData: {
        mimeType: file.type || 'image/png',
        data: base64FromArrayBuffer(await file.arrayBuffer())
      }
    });
  }

  return parts;
};

const extractCandidateText = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text)
    .filter(Boolean)
    .join('');
};

const callGemini = async (env, requestPayload) => {
  const model = trim(env.GEMINI_MODEL) || DEFAULT_MODEL;
  const apiKey = trim(env.GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY saknas i proxyns miljo.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || 'Gemini-anropet misslyckades.';
    throw new Error(message);
  }

  const candidateText = extractCandidateText(payload);
  if (!candidateText) {
    throw new Error('Gemini returnerade inget tolkbart svar.');
  }

  return JSON.parse(candidateText);
};

const parseFormValue = (formData, key) => trim(formData.get(key));

export const handleGenerateTheory = async (request, env) => {
  const formData = await request.formData();
  const accessCode = parseFormValue(formData, 'accessCode');
  const locale = parseFormValue(formData, 'locale') || 'sv';
  const projectTitle = parseFormValue(formData, 'projectTitle');
  const pastedText = parseFormValue(formData, 'pastedText');
  const docxTexts = formData
    .getAll('docxText')
    .map((item) => trim(item))
    .filter(Boolean);
  const pdfFiles = formData.getAll('pdfFiles');
  const imageFiles = formData.getAll('imageFiles');

  if (!accessCode) {
    return jsonResponse(request, env, { error: 'Atkomstkod saknas.' }, 400);
  }

  if (trim(env.ACCESS_CODE) !== accessCode) {
    return jsonResponse(request, env, { error: 'Fel atkomstkod.' }, 401);
  }

  if (!checkRateLimit(request, env, accessCode)) {
    return jsonResponse(request, env, { error: 'For manga anrop. Prova snart igen.' }, 429);
  }

  if (!pastedText && docxTexts.length === 0 && pdfFiles.length === 0 && imageFiles.length === 0) {
    return jsonResponse(request, env, { error: 'Minst ett underlag maste skickas med.' }, 400);
  }

  const maxFileSize = Number.parseInt(env.MAX_FILE_SIZE_BYTES || `${DEFAULT_MAX_FILE_SIZE}`, 10);
  const maxTotalSize = Number.parseInt(env.MAX_TOTAL_SIZE_BYTES || `${DEFAULT_MAX_TOTAL_SIZE}`, 10);
  const totalBinaryBytes = [...pdfFiles, ...imageFiles].reduce((sum, file) => sum + (file?.size || 0), 0);

  if (totalBinaryBytes > maxTotalSize) {
    return jsonResponse(request, env, { error: 'Den totala filstorleken ar for stor.' }, 413);
  }

  try {
    validateFiles(pdfFiles, ['application/pdf'], maxFileSize);
    validateFiles(imageFiles, ['image/*'], maxFileSize);
  } catch (error) {
    return jsonResponse(request, env, { error: error.message }, 400);
  }

  const prompt = getGeminiPrompt({
    locale,
    projectTitle,
    pastedText,
    docxTexts,
    pdfCount: pdfFiles.length,
    imageCount: imageFiles.length
  });
  const parts = await buildGeminiParts({
    prompt,
    pdfFiles,
    imageFiles
  });

  try {
    const modelResponse = await callGemini(env, {
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
        responseSchema: theoryResponseSchema
      }
    });

    const normalized = normalizeModelPayload(modelResponse);

    if (!normalized.theory.projectTitle && projectTitle) {
      normalized.theory.projectTitle = projectTitle;
    }

    return jsonResponse(request, env, normalized, 200);
  } catch (error) {
    return jsonResponse(request, env, { error: error.message || 'Okant proxyfel.' }, 502);
  }
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request, env)
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/generate-theory') {
      return jsonResponse(request, env, { error: 'Endpoint finns inte.' }, 404);
    }

    if (request.method !== 'POST') {
      return jsonResponse(request, env, { error: 'Metoden stodjs inte.' }, 405);
    }

    return handleGenerateTheory(request, env);
  }
};
