const collapseWhitespace = (value) =>
  value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

export const extractTextFromDocx = async (file) => {
  const mammothModule = await import('mammoth/mammoth.browser');
  const mammoth = mammothModule.default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });

  return {
    text: collapseWhitespace(result.value || ''),
    warnings: (result.messages ?? []).map((message) => message.message).filter(Boolean)
  };
};
