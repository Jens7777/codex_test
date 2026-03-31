import { normalizeTheory } from './theory.js';
import { resolveApiUrl } from './config.js';

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.error || 'Genereringen misslyckades.';
  } catch (error) {
    return 'Genereringen misslyckades.';
  }
};

export const generateTheoryDraft = async ({
  locale = 'sv',
  projectTitle,
  pastedText,
  docxTexts,
  pdfFiles,
  imageFiles
}) => {
  const formData = new FormData();
  formData.append('locale', locale);
  formData.append('projectTitle', projectTitle ?? '');
  formData.append('pastedText', pastedText ?? '');

  (docxTexts ?? []).forEach((text) => {
    formData.append('docxText', text);
  });

  (pdfFiles ?? []).forEach((file) => {
    formData.append('pdfFiles', file, file.name);
  });

  (imageFiles ?? []).forEach((file) => {
    formData.append('imageFiles', file, file.name);
  });

  let response;
  try {
    response = await fetch(resolveApiUrl('/api/generate-theory'), {
      method: 'POST',
      body: formData
    });
  } catch (networkError) {
    throw new Error(
      'Kunde inte nå proxyn. Kontrollera att API-adressen är korrekt konfigurerad och att Cloudflare-workern är aktiv.'
    );
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();
  return {
    theory: normalizeTheory(data.theory),
    sourceSummary: data.sourceSummary ?? null,
    warnings: Array.isArray(data.warnings) ? data.warnings : []
  };
};
