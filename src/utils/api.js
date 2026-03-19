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
  accessCode,
  locale = 'sv',
  projectTitle,
  pastedText,
  docxTexts,
  pdfFiles,
  imageFiles
}) => {
  const formData = new FormData();
  formData.append('accessCode', accessCode);
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

  const response = await fetch(resolveApiUrl('/api/generate-theory'), {
    method: 'POST',
    body: formData
  });

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
