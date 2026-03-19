import { normalizeTheory } from './theory.js';

const STORAGE_KEY = 'forandringsteori-studio-draft-v1';

const sanitizeSource = (source) => {
  const base = {
    id: source.id,
    kind: source.kind,
    name: source.name,
    size: source.size,
    mimeType: source.mimeType,
    extractedText: source.extractedText ?? '',
    warnings: source.warnings ?? []
  };

  if (source.kind === 'pdf' || source.kind === 'image') {
    return {
      ...base,
      status: 'needs-reupload',
      needsReupload: true
    };
  }

  return {
    ...base,
    status: source.status ?? 'ready',
    needsReupload: false
  };
};

export const loadStoredDraft = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return {
      ...parsed,
      theory: normalizeTheory(parsed.theory),
      sources: (parsed.sources ?? []).map((source) => ({
        ...source,
        file: null
      }))
    };
  } catch (error) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveStoredDraft = (snapshot) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    ...snapshot,
    sources: (snapshot.sources ?? []).map(sanitizeSource),
    savedAt: new Date().toISOString()
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearStoredDraft = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
