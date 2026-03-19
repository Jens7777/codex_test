const downloadBlob = (content, filename, type = 'application/json') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const exportDraftAsJson = (draft, filename = 'forandringsteori.json') => {
  const json = JSON.stringify(draft, null, 2);
  downloadBlob(json, filename, 'application/json');
};

export const printDraft = () => {
  if (typeof window !== 'undefined') {
    window.print();
  }
};
